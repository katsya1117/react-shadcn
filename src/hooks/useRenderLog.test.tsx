import { jest } from "@jest/globals";
import { render, renderHook } from "@testing-library/react";

import {
  configureRenderLog,
  diffTracked,
  isDeepEqual,
  useRenderLog,
} from "./useRenderLog";

// 有効のときだけログを出す。ログは「changed / 参照だけ変化 / 関数の参照が変化 / 原因不明」を区別する。

let logSpy: ReturnType<typeof jest.spyOn>;
let warnSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  configureRenderLog({ enabled: true });
});

afterEach(() => {
  configureRenderLog({ enabled: false });
  jest.restoreAllMocks();
});

describe("isDeepEqual / diffTracked", () => {
  it("参照が違っても、中身が同じなら等しい", () => {
    expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isDeepEqual([1], { 0: 1 })).toBe(false);
    expect(isDeepEqual(null, {})).toBe(false);
  });

  it("changed / sameContent / functions に分ける", () => {
    const fn1 = () => 1;
    const fn2 = () => 1;
    const diff = diffTracked(
      { a: 1, list: [1], cb: fn1, same: 5 },
      { a: 2, list: [1], cb: fn2, same: 5 },
    );
    expect(diff.changed).toEqual(["a"]);
    // list は、配列リテラルが別の参照で、中身は同じ → sameContent
    expect(diff.sameContent).toEqual(["list"]);
    expect(diff.functions).toEqual(["cb"]);
  });
});

describe("useRenderLog", () => {
  it("初回は、回数だけ出す", () => {
    renderHook(() => useRenderLog("Foo", { a: 1 }));
    expect(logSpy).toHaveBeenCalledWith("[render] Foo #1 (初回)");
  });

  it("値が変わったときは log で changed を出す", () => {
    const { rerender } = renderHook(
      ({ a }) => useRenderLog("Foo", { a }),
      { initialProps: { a: 1 } },
    );
    rerender({ a: 2 });
    expect(logSpy).toHaveBeenLastCalledWith("[render] Foo #2 changed: a");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("中身が同じで参照だけ変わったときは、warn で知らせる", () => {
    const { rerender } = renderHook(
      ({ list }) => useRenderLog("Foo", { list }),
      { initialProps: { list: [1, 2] } },
    );
    rerender({ list: [1, 2] });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("⚠ 参照だけ変化（中身は同じ）: list"),
    );
  });

  it("関数の参照が変わったときは、warn で useCallback 候補を知らせる", () => {
    const { rerender } = renderHook(({ cb }) => useRenderLog("Foo", { cb }), {
      initialProps: { cb: () => 1 },
    });
    rerender({ cb: () => 1 });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("useCallback 候補）: cb"),
    );
  });

  it("tracked に変化がなくても再描画されたら、原因不明として warn で知らせる", () => {
    const { rerender } = renderHook(() => useRenderLog("Foo", { a: 1 }));
    rerender();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[render] Foo #2 原因不明"),
    );
  });

  it("tracked を省略しても動く", () => {
    const { rerender } = renderHook(() => useRenderLog("Foo"));
    rerender();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("原因不明"),
    );
  });

  it("マウントとアンマウントを出す（アンマウントには描画回数を添える）", () => {
    const { rerender, unmount } = renderHook(() =>
      useRenderLog("Foo", { a: 1 }),
    );
    expect(logSpy).toHaveBeenNthCalledWith(1, "[mount] Foo");
    expect(logSpy).toHaveBeenNthCalledWith(2, "[render] Foo #1 (初回)");
    rerender();
    unmount();
    expect(logSpy).toHaveBeenLastCalledWith("[unmount] Foo（描画 2 回で破棄）");
  });

  it("作り直された（key が変わった）ときは、unmount → mount の順に出る", () => {
    const Probe = () => {
      useRenderLog("Probe", { a: 1 });
      return null;
    };
    const { rerender } = render(<Probe key="x" />);
    logSpy.mockClear();
    rerender(<Probe key="y" />);
    expect(logSpy.mock.calls.map((call) => call[0])).toEqual([
      "[unmount] Probe（描画 1 回で破棄）",
      "[mount] Probe",
      "[render] Probe #1 (初回)",
    ]);
  });

  it("無効のときは何も出さない", () => {
    configureRenderLog({ enabled: false });
    const { rerender, unmount } = renderHook(() =>
      useRenderLog("Foo", { a: 1 }),
    );
    rerender();
    unmount();
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
