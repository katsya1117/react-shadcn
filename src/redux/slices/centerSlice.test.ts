import { configureStore } from "@reduxjs/toolkit";
import {
  centerSelector,
  centerSliceReducer,
  createCenter,
  getCenterInfo,
  getCenterList,
  removeCenter,
  updateCenterInfo,
} from "./centerSlice";

// CenterApi（インメモリのモック DB）を実際に呼ぶ結合寄りのテスト。
// DB はモジュール単位で共有されるため、各テストは自分が作成したデータだけを前提にする。
const makeStore = () =>
  configureStore({ reducer: { center: centerSliceReducer } });

describe("centerSlice", () => {
  it("getCenterList: 検索条件を保存し、結果と検索済みフラグを反映する", async () => {
    const store = makeStore();

    await store.dispatch(getCenterList({ center_name: "東京", page: 1 }));

    const state = store.getState();
    expect(centerSelector.searchConditionSelector()(state)).toEqual({
      center_name: "東京",
      page: 1,
    });
    expect(centerSelector.searchResultDispSelector()(state).settingSearched).toBe(
      true,
    );
    const list = centerSelector.centerListSelector()(state);
    expect(list?.items.map((c) => c.center_name)).toEqual(["東京センター"]);
    expect(list?.pagination.total).toBe(1);
  });

  it("getCenterList: メンバー名で逆引きできる", async () => {
    const store = makeStore();

    await store.dispatch(getCenterList({ user_list: ["中村"] }));

    const list = centerSelector.centerListSelector()(store.getState());
    expect(list?.items.map((c) => c.center_name)).toEqual(["大阪DR"]);
  });

  it("getCenterList: ページ番号が文字列（ページネーションURL由来）でも動く", async () => {
    const store = makeStore();

    await store.dispatch(
      getCenterList({ page: "2" as unknown as number, per_page: 1 }),
    );

    const list = centerSelector.centerListSelector()(store.getState());
    expect(list?.pagination.current_page).toBe(2);
    expect(list?.items).toHaveLength(1);
  });

  it("getCenterInfo: 存在しないセンターはエラーになる", async () => {
    const store = makeStore();

    await store.dispatch(getCenterInfo("x999"));

    expect((store.getState()).center.error.messages).not.toBe("");
    expect(centerSelector.centerTargetSelector()(store.getState())).toBeUndefined();
  });

  it("作成 → 取得 → 更新 → 削除の一連の流れ", async () => {
    const store = makeStore();

    const centerCd = await store
      .dispatch(createCenter({ center_name: "福岡センター", site: "福岡" }))
      .unwrap();
    expect(centerCd).toMatch(/^c\d+$/);

    await store.dispatch(getCenterInfo(centerCd));
    expect(
      centerSelector.centerTargetSelector()(store.getState()),
    ).toMatchObject({ center_name: "福岡センター", site: "福岡" });

    await store
      .dispatch(
        updateCenterInfo({
          centerCd,
          params: { center_name: "福岡DR" },
        }),
      )
      .unwrap();
    await store.dispatch(getCenterInfo(centerCd));
    expect(
      centerSelector.centerTargetSelector()(store.getState())?.center_name,
    ).toBe("福岡DR");

    await store.dispatch(removeCenter(centerCd)).unwrap();
    expect(
      centerSelector.centerTargetSelector()(store.getState()),
    ).toBeUndefined();
    await expect(store.dispatch(removeCenter(centerCd)).unwrap()).rejects.toBe(
      "センターが見つかりません。",
    );
  });

  it("createCenter: 同名のセンターはエラーメッセージ付きで reject される", async () => {
    const store = makeStore();

    await expect(
      store.dispatch(createCenter({ center_name: "東京センター" })).unwrap(),
    ).rejects.toBe("同名のセンターが既に存在します。");
    expect((store.getState()).center.error.messages).toBe(
      "同名のセンターが既に存在します。",
    );
  });

  it("updateCenterInfo: 存在しないセンターは reject される", async () => {
    const store = makeStore();

    await expect(
      store
        .dispatch(updateCenterInfo({ centerCd: "x999", params: {} }))
        .unwrap(),
    ).rejects.toBe("センターが見つかりません。");
  });
});
