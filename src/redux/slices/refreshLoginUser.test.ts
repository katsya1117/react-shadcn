import { jest } from "@jest/globals";
import { configureStore } from "@reduxjs/toolkit";
import { UsersApi } from "@/api";
import {
  refreshLoginUser,
  removeUser,
  updateUserInfo,
  userCreation,
  userSliceReducer,
} from "./userSlice";
import {
  centerSliceReducer,
  createCenter,
  removeCenter,
  updateCenterInfo,
} from "./centerSlice";

// 権限に影響しうる更新（ユーザー・センターの作成/更新/削除）が成功したら、
// ログインユーザーの情報を取り直す（refreshLoginUser）ことを確認する。
// 取り直しは「待たない」ので、更新の完了後に、非同期の取得が終わるのを待ってから検証する。

const makeStore = (loginUserCd = "me") => {
  const store = configureStore({
    reducer: { user: userSliceReducer, center: centerSliceReducer },
  });
  // ログインユーザーを設定済みの状態にする
  store.dispatch({ type: "user/setUserId", payload: loginUserCd });
  return store;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const meInfo = { user: { user_cd: "me", perm_cd: "p2" }, user_cd: "me" };

let getUserSpy: jest.SpiedFunction<typeof UsersApi.prototype.getUser>;

beforeEach(() => {
  getUserSpy = jest
    .spyOn(UsersApi.prototype, "getUser")
    .mockResolvedValue({ data: meInfo } as never);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("refreshLoginUser", () => {
  it("ログインユーザーが未設定（空）なら、何もしない", async () => {
    const store = makeStore("");
    await store.dispatch(refreshLoginUser());
    expect(getUserSpy).not.toHaveBeenCalled();
    expect(store.getState().user.loginUserInfo).toBeUndefined();
  });

  it("ログインユーザーの情報を取り直して、state に反映する", async () => {
    const store = makeStore("me");
    await store.dispatch(refreshLoginUser());
    expect(getUserSpy).toHaveBeenCalledWith("me", expect.anything());
    expect(store.getState().user.loginUserInfo).toEqual(meInfo);
  });

  it("取り直しの間、isLoading を立てない（ユーザー一覧の読み込み表示と共有のため）", async () => {
    const store = makeStore("me");
    const pending = store.dispatch(refreshLoginUser());
    expect(store.getState().user.isLoading).toBe(false);
    await pending;
    expect(store.getState().user.isLoading).toBe(false);
  });

  it("失敗しても、エラーを出さず、今の情報を残す", async () => {
    const store = makeStore("me");
    await store.dispatch(refreshLoginUser());
    getUserSpy.mockRejectedValue(new Error("network"));

    await store.dispatch(refreshLoginUser());

    expect(store.getState().user.loginUserInfo).toEqual(meInfo);
    expect(store.getState().user.error.isError).toBe(false);
  });
});

describe("更新が成功したら、ログインユーザーを取り直す", () => {
  it("updateUserInfo: 成功で取り直す", async () => {
    jest
      .spyOn(UsersApi.prototype, "updateUser")
      .mockResolvedValue({ data: { ok: true } } as never);
    const store = makeStore("me");

    await store.dispatch(updateUserInfo({ userCd: "me", params: {} as never }));
    await flush();

    expect(getUserSpy).toHaveBeenCalledTimes(1);
    expect(store.getState().user.loginUserInfo).toEqual(meInfo);
  });

  it("updateUserInfo: 失敗したら取り直さない", async () => {
    jest
      .spyOn(UsersApi.prototype, "updateUser")
      .mockRejectedValue(new Error("fail"));
    const store = makeStore("me");

    await store.dispatch(updateUserInfo({ userCd: "me", params: {} as never }));
    await flush();

    expect(getUserSpy).not.toHaveBeenCalled();
  });

  it("userCreation: 成功で取り直す", async () => {
    jest
      .spyOn(UsersApi.prototype, "createUser")
      .mockResolvedValue({ data: { ok: true } } as never);
    const store = makeStore("me");

    await store.dispatch(userCreation({ user_cd: "new" } as never));
    await flush();

    expect(getUserSpy).toHaveBeenCalledTimes(1);
  });

  it("removeUser: 成功で取り直す", async () => {
    jest
      .spyOn(UsersApi.prototype, "removeUser")
      .mockResolvedValue({ data: { ok: true } } as never);
    const store = makeStore("me");

    await store.dispatch(removeUser("other"));
    await flush();

    expect(getUserSpy).toHaveBeenCalledTimes(1);
  });

  it("センターの作成・更新・削除: 成功で取り直す。失敗では取り直さない", async () => {
    const store = makeStore("me");
    const name = `取り直しテスト${Date.now()}`;

    // 作成
    const centerCd = await store
      .dispatch(createCenter({ center_name: name }))
      .unwrap();
    await flush();
    expect(getUserSpy).toHaveBeenCalledTimes(1);

    // 失敗（同名）は取り直さない
    await store.dispatch(createCenter({ center_name: name }));
    await flush();
    expect(getUserSpy).toHaveBeenCalledTimes(1);

    // 更新
    await store
      .dispatch(
        updateCenterInfo({ centerCd, params: { center_name: `${name}2` } }),
      )
      .unwrap();
    await flush();
    expect(getUserSpy).toHaveBeenCalledTimes(2);

    // 削除
    await store.dispatch(removeCenter(centerCd)).unwrap();
    await flush();
    expect(getUserSpy).toHaveBeenCalledTimes(3);
  });
});
