# useRenderLog 仕様書（無駄な再レンダリングの調査用フック）

| 項目 | 内容 |
| --- | --- |
| 実装 | [src/hooks/useRenderLog.ts](../src/hooks/useRenderLog.ts) |
| テスト | [src/hooks/useRenderLog.test.tsx](../src/hooks/useRenderLog.test.tsx) |
| 用途 | 開発時に、無駄な再レンダリングを、コンソールのログから見つける（why-did-you-render 相当を、依存なしで） |

## 1. 使い方

調べたいコンポーネントの先頭で、コンポーネント名と、再描画の原因かもしれない値を渡して呼ぶ。

```tsx
const SSContent = ({ rootFolderId, areaFolderName }: Props) => {
  const areas = useSelector(...);
  const handleRefresh = useCallback(...);
  useRenderLog("SSContent", { rootFolderId, areaFolderName, areas, handleRefresh });
  ...
};
```

- 第 1 引数: コンポーネント名（ログの見出し）。
- 第 2 引数 `tracked`（省略可）: **再描画の原因かもしれない値**を、名前付きで並べたオブジェクト。描画のたびに、前回との差を調べる。省略すると、描画の回数を数えるだけになる（2 回目以降は、すべて「原因不明」）。

### 書き方の例

原因の候補になりうる値は、**全部まとめて 1 つの `tracked` に並べる**。1 つだけ書くと、他の値の変化を見逃し、「原因不明」と誤解する。

```tsx
// props を分割代入で受けているとき: 使っているものを並べる
const Child = ({ items, selected, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  useRenderLog("Child", { items, selected, onSelect, open });
  ...
};

// props をオブジェクトのまま受けているとき: 丸ごと渡せる
const Child = (props: Props) => {
  useRenderLog("Child", props);
  ...
};

// children がある場合は除く（下記）
const Child = ({ children, ...rest }: Props) => {
  useRenderLog("Child", rest);
  ...
};
```

**`children` は渡さない。** JSX の `children` は、描画のたびに新しいオブジェクトになり、React の内部構造への参照も持つため、毎回「参照だけ変化」と出て、比較も重くなる。

### 何を `tracked` に渡すか

再描画を引き起こすのは、次の 4 つ。**props そのものは、再描画の原因ではない。**

| 再描画の原因 | `tracked` に渡すもの |
| --- | --- |
| 自分の state（`useState` / `useReducer`） | その state の値 |
| state 相当のフック（`useSelector`、Context の値、`useSyncExternalStore` など） | そのフックの戻り値 |
| 親の再描画（親が描画されると、子は、props が同じでも、既定で再描画される） | props（下記） |
| 作り直し（`key` や型の変化による、アンマウント → マウント） | 渡す必要なし。`[mount]` / `[unmount]` ログで分かる（§3） |

props を渡す理由は、**親の再描画が、子に「新しい値」を渡したのか、同じ内容を渡しただけか**を見分けるため。
- props の参照だけ変わっている（`⚠ 参照だけ変化`）→ 親が毎回新しい配列・オブジェクト・関数を作って渡している。`useMemo` / `useCallback` と `React.memo` で止められる。
- props に変化がなく、state も変わっていない（`原因不明`）→ 親が再描画しただけ。`React.memo` で止められる。

## 2. 有効にする

開発サーバーのみ。**既定は無効**（コンソールが埋まるため）。

1. `.env.local` に `VITE_RENDER_LOG=true` を入れる（`.env.example` に記載）。
2. 開発サーバーを再起動する。

`main.tsx` が、`import.meta.env.DEV && VITE_RENDER_LOG === 'true'` のときだけ `configureRenderLog({ enabled: true })` を呼ぶ。本番ビルドと、テスト（既定）では、何も出力しない。

## 3. ログの読み方

描画のたびに、前回の `tracked` と比べ、次の 4 種類に分けて出す。

| ログ | 意味 | レベル | 対処の目安 |
| --- | --- | --- | --- |
| `[mount] Foo` | マウントされた（画面に出た） | log | — |
| `[unmount] Foo（描画 N 回で破棄）` | アンマウントされた（画面から消えた）。それまでの描画回数つき | log | 描画が少ないうちに、マウント・アンマウントが繰り返されるなら、作り直しが起きている（`key` や、条件分岐での出し分けを確認） |
| `#1 (初回)` | 最初の描画（`[mount]` の直後） | log | — |
| `changed: a, b` | 値が変わった。再描画の正当な理由になりうる | log | 通常は問題なし |
| `⚠ 参照だけ変化（中身は同じ）: list` | **中身は同じなのに、参照だけ新しい。** 無駄な再描画の典型 | warn | `useMemo` で値を固定する。selector が毎回新しい配列・オブジェクトを返していないか確認する（`createSelector` の使い方） |
| `⚠ 関数の参照が変化（useCallback 候補）: cb` | 関数が毎回作り直されている | warn | `useCallback` にする。子が `memo` のときに効く |
| `原因不明（tracked に変化なし…）` | `tracked` に変化がないのに再描画された | warn | 親の再描画、または `tracked` に含めていない state / context が原因。`tracked` を増やして絞る |

例:

```
[mount] SSContent
[render] SSContent #1 (初回)
[render] SSContent #2 changed: areas
[render] SSContent #3 ⚠ 参照だけ変化（中身は同じ）: areas
[render] SSContent #4 原因不明（tracked に変化なし。親の再描画、または tracked にない state / context）
[unmount] SSContent（描画 4 回で破棄）
```

作り直し（`key` の変化など）は、`[unmount]` → `[mount]` → `#1 (初回)` の順に出る。再描画（`#2` 以降）とは区別できる。

## 4. 仕組みと制約

- ログは `useEffect`（依存配列なし）で出す。描画の最中に ref を書き換えないため、描画自体は純粋なまま（React の lint ルールにも沿う）。
- 比較は、まず `Object.is`。違えば、中身を再帰的に比べる（深さ 6 まで。循環参照・深すぎる入れ子は「違う」とみなす）。関数は参照のみ（中身は比べられない）。
- **React の StrictMode** を有効にすると、開発時は描画が 2 回走るので、回数が実際の 2 倍に見える（現状は無効）。
- 回数と差は、`tracked` に渡した値だけが対象。渡さなかった値の変化は、「原因不明」になる。
- 調査が終わったら、`useRenderLog` の呼び出しは消す（残してもログは出ないが、毎回の比較の分だけ、わずかに遅くなる）。
