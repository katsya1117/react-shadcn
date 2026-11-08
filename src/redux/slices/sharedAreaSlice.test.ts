import { configureStore } from "@reduxjs/toolkit";
import {
  getSharedAreas,
  sharedAreaSelector,
  sharedAreaSliceReducer,
} from "./sharedAreaSlice";

// ShareAreaApi（インメモリのモック DB）を実際に呼ぶ結合寄りのテスト
const makeStore = () =>
  configureStore({ reducer: { sharedArea: sharedAreaSliceReducer } });

const titles = (userCd: string) =>
  makeStore().dispatch(getSharedAreas(userCd)).then((r) =>
    (r.payload as { centerName: string; folderName: string }[]).map(
      (i) => `${i.centerName} › ${i.folderName}`,
    ),
  );

describe("sharedAreaSlice", () => {
  it("初期状態は、未取得・読み込み中でない・エラーなし", () => {
    const state = makeStore().getState();
    expect(sharedAreaSelector.loadedSelector()(state)).toBe(false);
    expect(sharedAreaSelector.isLoadingSelector()(state)).toBe(false);
    expect(sharedAreaSelector.errorSelector()(state).isError).toBe(false);
  });

  it("取得中は isLoading、完了後は items と loaded を反映する", async () => {
    const store = makeStore();
    const promise = store.dispatch(getSharedAreas("u001"));
    expect(sharedAreaSelector.isLoadingSelector()(store.getState())).toBe(true);
    await promise;
    const state = store.getState();
    expect(sharedAreaSelector.isLoadingSelector()(state)).toBe(false);
    expect(sharedAreaSelector.loadedSelector()(state)).toBe(true);
    expect(sharedAreaSelector.itemsSelector()(state)).toHaveLength(4);
  });

  it("センター名、フォルダ名の順に並ぶ", async () => {
    expect(await titles("u001")).toEqual([
      "JCLGD2SWDV › 契約書",
      "JCLGD2SWDV › 見積資料",
      "JCLGD3NW › 検証環境の手順書",
      "JCLGD3NW › 設計図",
    ]);
  });

  it("グループ宛ての共有も出る（ユーザー宛てがなくても）", async () => {
    // dev-lead は grp-dev 所属。grp-dev 宛ては 見積資料(viewer) と 契約書(viewer)
    expect(await titles("dev-lead")).toEqual([
      "JCLGD2SWDV › 契約書",
      "JCLGD2SWDV › 見積資料",
    ]);
  });

  it("ユーザー宛て(editor)とグループ宛て(viewer)が重なるフォルダは、強いロールを採用して 1 枚にまとめる", async () => {
    const store = makeStore();
    await store.dispatch(getSharedAreas("u001"));
    const items = sharedAreaSelector.itemsSelector()(store.getState());
    const estimate = items.filter((i) => i.folderName === "見積資料");
    expect(estimate).toHaveLength(1);
    expect(estimate[0].role).toBe("editor");
  });

  it("所属センター宛ての共有は除く", async () => {
    expect(await titles("u001")).not.toContain(
      expect.stringContaining("共有メモ"),
    );
  });

  it("共有がないユーザーは空配列で、loaded は true", async () => {
    const store = makeStore();
    await store.dispatch(getSharedAreas("nobody"));
    const state = store.getState();
    expect(sharedAreaSelector.itemsSelector()(state)).toEqual([]);
    expect(sharedAreaSelector.loadedSelector()(state)).toBe(true);
  });
});
