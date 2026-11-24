import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import { ssSliceReducer } from "@/redux/slices/ssSlice";
import type { BoxFolder } from "@/types/BoxUiElements";
import { useBoxExplorer } from "./useBoxExplorer";

// 仕様は docs/spec-use-box-explorer.md を参照（テスト番号 T-n は同書 10.1 節に対応）。
// Box SDK は使わず、navigate イベントは handleNavigate を直接呼んで模擬する。
// 「戻る / 進む」は navigateTo を呼ぶ → その結果として navigate イベントが届く、という流れを再現する。

const ROOT = "R";

const folder = (id: string, type = "folder"): BoxFolder => ({
  id,
  type,
  name: `name-${id}`,
  path_collection: { entries: [{ id: "0", name: "All Files" }] },
});

type Options = Partial<Parameters<typeof useBoxExplorer>[0]>;

const setupHook = (options: Options = {}) => {
  const store = configureStore({ reducer: { ss: ssSliceReducer } });
  const dispatchSpy = jest.spyOn(store, "dispatch");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(
    () =>
      useBoxExplorer({
        rootFolderId: ROOT,
        initialFolder: { id: ROOT, name: "", pathCollection: { entries: [] } },
        savedHistory: [ROOT],
        savedIndex: 0,
        ...options,
      }),
    { wrapper },
  );

  const navigateTo = jest.fn();
  result.current.explorerRef.current = {
    show: jest.fn(),
    navigateTo,
  };

  /** Explorer の navigate イベントを模擬する */
  const navigate = (id: string, type?: string) =>
    act(() => result.current.handleNavigate(folder(id, type)));
  const goBack = () => act(() => result.current.handleGoBack());
  const goForward = () => act(() => result.current.handleGoForward());

  /** 履歴の現在位置と、現在地・Redux の保存値をまとめて読む */
  const state = () => ({
    current: result.current.currentFolder.id,
    history: result.current.folderHistory,
    index: result.current.historyIndex,
    isRestoring: result.current.isRestoring,
    reduxCurrent: store.getState().ss.currentFolderByRootId[ROOT]?.id,
    reduxHistory: store.getState().ss.folderHistoryByRootId[ROOT],
    reduxIndex: store.getState().ss.historyIndexByRootId[ROOT],
  });

  return { result, store, dispatchSpy, navigateTo, navigate, goBack, goForward, state };
};

describe("useBoxExplorer", () => {
  describe("初期状態", () => {
    it("T-1: 引数の値が初期値になる（復元先なしなら isRestoring=false）", () => {
      const { result } = setupHook({
        savedHistory: [ROOT, "A"],
        savedIndex: 1,
        initialFolder: { id: "A", name: "A", pathCollection: { entries: [] } },
      });

      expect(result.current.currentFolder.id).toBe("A");
      expect(result.current.folderHistory).toEqual([ROOT, "A"]);
      expect(result.current.historyIndex).toBe(1);
      expect(result.current.isRestoring).toBe(false);
      expect(result.current.canGoBack).toBe(true);
      expect(result.current.canGoForward).toBe(false);
    });

    it("T-1: 復元先があれば isRestoring=true で始まる", () => {
      const { result } = setupHook({ restoreTargetId: "T" });

      expect(result.current.isRestoring).toBe(true);
    });
  });

  describe("通常の移動（履歴の更新）", () => {
    it("T-2: 新しいフォルダは履歴の末尾に追加され、位置が末尾になる", () => {
      const { navigate, state } = setupHook();

      navigate("A");
      navigate("B");

      expect(state()).toMatchObject({
        current: "B",
        history: [ROOT, "A", "B"],
        index: 2,
        reduxCurrent: "B",
        reduxHistory: [ROOT, "A", "B"],
        reduxIndex: 2,
      });
    });

    it("現在地には、イベントの名前とパス情報が反映される", () => {
      const { navigate, result } = setupHook();

      navigate("A");

      expect(result.current.currentFolder).toEqual({
        id: "A",
        name: "name-A",
        pathCollection: { entries: [{ id: "0", name: "All Files" }] },
      });
    });

    it("path_collection がないイベントは pathCollection が undefined になる", () => {
      const { result } = setupHook();

      act(() =>
        result.current.handleNavigate({ id: "A", type: "folder" } as BoxFolder),
      );

      expect(result.current.currentFolder).toEqual({
        id: "A",
        name: "",
        pathCollection: undefined,
      });
    });

    it("T-3: パンくずで手前のフォルダへ移動すると、履歴は変えず位置だけ動く", () => {
      const { navigate, state } = setupHook();
      navigate("A");
      navigate("B");
      navigate("C");

      navigate("B");

      expect(state()).toMatchObject({
        current: "B",
        history: [ROOT, "A", "B", "C"],
        index: 2,
      });
    });

    it("T-4: 履歴の先にあるフォルダへ移動すると、履歴は変えず位置だけ動く", () => {
      const { navigate, state } = setupHook();
      navigate("A");
      navigate("B");
      navigate("C");
      navigate("A"); // 手前へ（位置 1）

      navigate("C"); // 履歴では先にある

      expect(state()).toMatchObject({
        current: "C",
        history: [ROOT, "A", "B", "C"],
        index: 3,
      });
    });

    it("T-5: 途中から新しいフォルダへ移動すると、位置より後ろが切り捨てられる", () => {
      const { navigate, state } = setupHook();
      navigate("A");
      navigate("B");
      navigate("C");
      navigate("A");

      navigate("Z");

      expect(state()).toMatchObject({
        current: "Z",
        history: [ROOT, "A", "Z"],
        index: 2,
      });
    });

    it("T-6: 同じフォルダの重複通知は無視される", () => {
      const { navigate, state, dispatchSpy } = setupHook();
      navigate("A");
      dispatchSpy.mockClear();

      navigate("A");

      expect(state()).toMatchObject({ current: "A", history: [ROOT, "A"], index: 1 });
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it("T-7: 種別が folder でないイベントは無視される", () => {
      const { navigate, state } = setupHook();

      navigate("F", "file");

      expect(state()).toMatchObject({ current: ROOT, history: [ROOT], index: 0 });
    });
  });

  describe("戻る / 進む", () => {
    it("T-8: 先頭で「戻る」、末尾で「進む」を押しても何も起きない", () => {
      const { navigate, goBack, goForward, navigateTo, state } = setupHook();

      goBack();
      expect(navigateTo).not.toHaveBeenCalled();

      navigate("A");
      goForward();
      expect(navigateTo).not.toHaveBeenCalled();
      expect(state()).toMatchObject({ current: "A", history: [ROOT, "A"], index: 1 });
    });

    it("「戻る」は位置を 1 つ戻し、移動先のフォルダへ navigateTo を呼ぶ", () => {
      const { navigate, goBack, navigateTo, state, result } = setupHook();
      navigate("A");
      navigate("B");

      goBack();

      expect(navigateTo).toHaveBeenCalledWith("A");
      expect(state()).toMatchObject({ index: 1, reduxIndex: 1 });
      expect(result.current.canGoBack).toBe(true);
      expect(result.current.canGoForward).toBe(true);
    });

    it("T-9: 「戻る」の結果として届くイベントで、現在地が移動先に更新される", () => {
      const { navigate, goBack, state } = setupHook();
      navigate("A");
      navigate("B");

      goBack();
      navigate("A"); // navigateTo(A) の結果として Explorer が発火するイベント

      expect(state()).toMatchObject({
        current: "A",
        reduxCurrent: "A",
        history: [ROOT, "A", "B"],
        index: 1,
      });
    });

    it("T-9: 「進む」の結果として届くイベントで、現在地が移動先に更新される", () => {
      const { navigate, goBack, goForward, state } = setupHook();
      navigate("A");
      navigate("B");
      goBack();
      navigate("A");

      goForward();
      navigate("B");

      expect(state()).toMatchObject({
        current: "B",
        reduxCurrent: "B",
        history: [ROOT, "A", "B"],
        index: 2,
      });
    });

    it("T-10: 「戻る」の後の最初のクリックが、履歴に積まれる", () => {
      const { navigate, goBack, state } = setupHook();
      navigate("A");
      navigate("B");
      goBack();
      navigate("A");

      navigate("C");

      expect(state()).toMatchObject({
        current: "C",
        history: [ROOT, "A", "C"],
        index: 2,
        reduxHistory: [ROOT, "A", "C"],
      });
    });

    it("「戻る」のイベントが重複して届いても、2 回目は無視される", () => {
      const { navigate, goBack, state, dispatchSpy } = setupHook();
      navigate("A");
      navigate("B");
      goBack();
      navigate("A");
      dispatchSpy.mockClear();

      navigate("A");

      expect(state()).toMatchObject({ current: "A", index: 1 });
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it("T-11: 「戻る」を続けて押すと、位置が 2 つ戻る（同期的な最新値を使う）", () => {
      const { navigate, result, navigateTo, state } = setupHook();
      navigate("A");
      navigate("B");
      navigate("C");

      // 再描画を挟まずに連続で呼ぶ
      act(() => {
        result.current.handleGoBack();
        result.current.handleGoBack();
      });

      expect(navigateTo.mock.calls.map((c) => c[0])).toEqual(["B", "A"]);
      expect(state()).toMatchObject({ index: 1 });
    });
  });

  describe("復元", () => {
    const restoreOptions: Options = {
      restoreTargetId: "T",
      savedHistory: [ROOT, "A", "T"],
      savedIndex: 2,
      initialFolder: { id: "T", name: "T", pathCollection: { entries: [] } },
    };

    it("T-12: 復元先のイベントで復元が完了する。履歴は変わらず、navigateTo は呼ばれない", () => {
      const { navigate, navigateTo, state, dispatchSpy } = setupHook(restoreOptions);

      navigate("T");

      expect(state()).toMatchObject({
        current: "T",
        isRestoring: false,
        history: [ROOT, "A", "T"],
        index: 2,
        reduxCurrent: "T",
      });
      expect(navigateTo).not.toHaveBeenCalled();
      // 履歴は書き込まない（現在地のみ）
      expect(
        dispatchSpy.mock.calls.filter(
          ([action]) => (action as { type: string }).type === "ss/setFolderHistory",
        ),
      ).toHaveLength(0);
    });

    it("T-13: ルートのイベントでは復元先へ navigateTo を呼ぶ（状態は変わらない）。復元先のイベントで完了する", () => {
      const { navigate, navigateTo, state } = setupHook(restoreOptions);

      navigate(ROOT);

      expect(navigateTo).toHaveBeenCalledWith("T");
      expect(state()).toMatchObject({ current: "T", isRestoring: true, index: 2 });

      navigate("T");

      expect(state()).toMatchObject({ current: "T", isRestoring: false });
    });

    it("復元中に無関係なフォルダのイベントを受けると、通常の移動として扱われる（isRestoring は true のまま）", () => {
      const { navigate, state } = setupHook(restoreOptions);

      navigate("Q");

      expect(state()).toMatchObject({
        current: "Q",
        isRestoring: true,
        history: [ROOT, "A", "T", "Q"],
        index: 3,
      });
    });
  });

  describe("Redux への保存", () => {
    it("T-14: 現在地と履歴の更新のたびに、setCurrentFolder / setFolderHistory が dispatch される", () => {
      const { navigate, dispatchSpy } = setupHook();

      navigate("A");

      const types = dispatchSpy.mock.calls.map(
        ([action]) => (action as { type: string }).type,
      );
      expect(types).toContain("ss/setCurrentFolder");
      expect(types).toContain("ss/setFolderHistory");
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ss/setFolderHistory",
          payload: { rootFolderId: ROOT, history: [ROOT, "A"], index: 1 },
        }),
      );
    });
  });

  describe("Explorer のインスタンスがない場合", () => {
    it("T-15: 「戻る / 進む」を押しても例外が出ない", () => {
      const { navigate, result } = setupHook();
      navigate("A");
      result.current.explorerRef.current = undefined;

      expect(() => act(() => result.current.handleGoBack())).not.toThrow();
      expect(() => act(() => result.current.handleGoForward())).not.toThrow();
    });
  });
});
