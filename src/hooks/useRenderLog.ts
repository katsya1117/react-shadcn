import { useEffect, useRef } from "react";

/**
 * 無駄な再レンダリングを、コンソールのログから見つけるための開発用フック（why-did-you-render 相当を、依存なしで）。
 *
 * 使い方（調べたいコンポーネントの先頭で呼ぶ）:
 *   useRenderLog("SS", { rootFolderId, areas, handleRefresh });   // 原因の候補は、全部まとめて並べる
 *   useRenderLog("Child", props);                                 // props をオブジェクトのまま受けているなら、丸ごと渡せる
 *   const { children, ...rest } = props; useRenderLog("Child", rest); // children は渡さない（毎回新しくなり、比較も重い）
 *
 * 第 2 引数 tracked には、「再描画の原因かもしれない値」を、名前付きで渡す。再描画を引き起こすのは、
 * 自分の state、state 相当のフック（useSelector・Context など）、親の再描画の 3 つ。props 自体は原因ではないが、
 * 「親の再描画が、新しい値を渡したのか、同じ内容を渡しただけか」を見分けるために、props も渡す。
 * 描画のたびに、前回との差を、次の 3 種類に分けてログに出す。
 *   - changed          : 値が変わった（再描画の正当な理由になりうる）
 *   - ⚠ 参照だけ変化    : 中身は同じなのに、参照だけ新しい。無駄な再描画の典型（useMemo / useCallback / selector の見直し候補）
 *   - 原因不明          : tracked に変化がない。親の再描画、または tracked に含めていない state / context が原因
 * あわせて、マウント（[mount]）とアンマウント（[unmount]、描画回数つき）も出す。作り直し（key の変化など）は、
 * [unmount] → [mount] の順に出るので、再描画と区別できる。
 *
 * 有効にするのは開発時のみ。`.env.local` に VITE_RENDER_LOG=true を入れる（main.tsx が configureRenderLog を呼ぶ）。
 * 無効のときは何もしない（本番・テストでは出力なし）。ログは effect で出すので、描画自体は純粋なまま。
 * 設計は docs/spec-use-render-log.md を参照。
 */

let enabled = false;

/** 起動時（main.tsx）に設定する。enabled は、開発時（import.meta.env.DEV）かつ VITE_RENDER_LOG=true のときのみ true にする */
export const configureRenderLog = (options: { enabled: boolean }) => {
  enabled = options.enabled;
};

export const isRenderLogEnabled = () => enabled;

const MAX_DEPTH = 6;

/** 参照が違っても、中身が同じか（循環参照・深すぎる入れ子は「違う」とみなす）。関数は参照比較のみ */
export const isDeepEqual = (a: unknown, b: unknown, depth = 0): boolean => {
  if (Object.is(a, b)) return true;
  if (depth >= MAX_DEPTH) return false;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      isDeepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        depth + 1,
      ),
  );
};

export type RenderDiff = {
  /** 値が変わったキー */
  changed: string[];
  /** 参照だけ変わったキー（中身は同じ。関数は含まない） */
  sameContent: string[];
  /** 関数の参照が変わったキー（useCallback の候補。中身は比較できない） */
  functions: string[];
};

/** 前回と今回の tracked を比べる */
export const diffTracked = (
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): RenderDiff => {
  const diff: RenderDiff = { changed: [], sameContent: [], functions: [] };
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    const before = prev[key];
    const after = next[key];
    if (Object.is(before, after)) continue;
    if (typeof before === "function" && typeof after === "function") {
      diff.functions.push(key);
    } else if (isDeepEqual(before, after)) {
      diff.sameContent.push(key);
    } else {
      diff.changed.push(key);
    }
  }
  return diff;
};

export const useRenderLog = (
  componentName: string,
  tracked: Record<string, unknown> = {},
) => {
  const countRef = useRef(0);
  const prevRef = useRef<Record<string, unknown> | null>(null);

  // マウント・アンマウント。key や型が変わって、作り直された（= アンマウント → マウント）ことも、ここで分かる。
  // 先に宣言するので、初回は [mount] → [render] #1 の順に出る。アンマウントには、それまでの描画回数を添える。
  useEffect(() => {
    if (!enabled) return;
    console.log(`[mount] ${componentName}`);
    return () => {
      if (!enabled) return;
      console.log(
        `[unmount] ${componentName}（描画 ${countRef.current} 回で破棄）`,
      );
    };
    // componentName は、通常は変わらない固定の文字列。変わっても、作り直しにはしない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 描画のたびに走る（依存配列なし）。ログと ref の更新は、描画の外（effect）で行う。
  useEffect(() => {
    if (!enabled) return;
    countRef.current += 1;
    const count = countRef.current;
    const prev = prevRef.current;
    prevRef.current = tracked;

    if (prev === null) {
      console.log(`[render] ${componentName} #${count} (初回)`);
      return;
    }

    const { changed, sameContent, functions } = diffTracked(prev, tracked);
    const wasteful = sameContent.length > 0 || functions.length > 0;
    const parts: string[] = [];
    if (changed.length > 0) parts.push(`changed: ${changed.join(", ")}`);
    if (sameContent.length > 0) {
      parts.push(`⚠ 参照だけ変化（中身は同じ）: ${sameContent.join(", ")}`);
    }
    if (functions.length > 0) {
      parts.push(`⚠ 関数の参照が変化（useCallback 候補）: ${functions.join(", ")}`);
    }
    if (parts.length === 0) {
      parts.push(
        "原因不明（tracked に変化なし。親の再描画、または tracked にない state / context）",
      );
    }
    const message = `[render] ${componentName} #${count} ${parts.join(" / ")}`;
    // 無駄な再描画の疑いは warn（目立たせる）。値の変化だけなら log
    if (wasteful || changed.length === 0) console.warn(message);
    else console.log(message);
  });
};
