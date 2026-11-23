import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ShareAreaApi } from "@/api";
import type { ShareArea } from "@/config/shareAreaConfig";
import { userActions, userSliceReducer } from "@/redux/slices/userSlice";
import { sharedAreaSliceReducer } from "@/redux/slices/sharedAreaSlice";
import { useAreaAdminGate } from "./useAreaAdminGate";

// 管理者の確認（SS 画面に入れるか）の検証。
// 一覧 API（getMyCenterAreas）をスパイで差し替え、返す isAdmin によって、結果が変わることを確認する。
// 確認が終わるまでは "checking"（SSContent を作らない）であることが、このフックの要点。

const area = (boxFolderId: string, isAdmin?: boolean): ShareArea => ({
  code: boxFolderId,
  folderName: boxFolderId,
  label: boxFolderId,
  jclUrl: "/jcl",
  boxFolderId,
  isAdmin,
});

const storeRef: { current: ReturnType<typeof configureStore> | null } = {
  current: null,
};

const makeWrapper = (loginUserCd = "u001") => {
  const store = configureStore({
    reducer: { user: userSliceReducer, sharedArea: sharedAreaSliceReducer },
    preloadedState: {
      user: { ...userSliceReducer(undefined, { type: "init" }), loginUserCd },
    },
  });
  storeRef.current = store;
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return Wrapper;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useAreaAdminGate", () => {
  it("確認が終わるまでは checking、管理者の領域なら allowed", async () => {
    let resolve!: (v: { data: ShareArea[] }) => void;
    jest.spyOn(ShareAreaApi.prototype, "getMyCenterAreas").mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useAreaAdminGate("A"), {
      wrapper: makeWrapper(),
    });
    expect(result.current).toBe("checking");

    await act(async () => {
      resolve({ data: [area("A", true)] });
    });
    await waitFor(() => expect(result.current).toBe("allowed"));
  });

  it("管理者でない領域は denied", async () => {
    jest
      .spyOn(ShareAreaApi.prototype, "getMyCenterAreas")
      .mockResolvedValue({ data: [area("A", false), area("B", true)] });
    const { result } = renderHook(() => useAreaAdminGate("A"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current).toBe("denied"));
  });

  it("一覧に無い領域（isAdmin 未設定を含む）は denied", async () => {
    jest
      .spyOn(ShareAreaApi.prototype, "getMyCenterAreas")
      .mockResolvedValue({ data: [area("A"), area("B", true)] });
    const missing = renderHook(() => useAreaAdminGate("Z"), {
      wrapper: makeWrapper(),
    });
    const unset = renderHook(() => useAreaAdminGate("A"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(missing.result.current).toBe("denied"));
    await waitFor(() => expect(unset.result.current).toBe("denied"));
  });

  it("取得に失敗したときは denied（確認できないときは入れない）", async () => {
    jest
      .spyOn(ShareAreaApi.prototype, "getMyCenterAreas")
      .mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useAreaAdminGate("A"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current).toBe("denied"));
  });

  it("入るたびに取り直す（前回の結果を使わない）", async () => {
    const spy = jest
      .spyOn(ShareAreaApi.prototype, "getMyCenterAreas")
      .mockResolvedValue({ data: [area("A", true)] });
    const wrapper = makeWrapper();

    const first = renderHook(() => useAreaAdminGate("A"), { wrapper });
    await waitFor(() => expect(first.result.current).toBe("allowed"));
    first.unmount();

    // 権限が失われた状態で、再び入る。前回の "allowed" ではなく、取り直した結果（denied）になる
    spy.mockResolvedValue({ data: [area("A", false)] });
    const second = renderHook(() => useAreaAdminGate("A"), { wrapper });
    expect(second.result.current).toBe("checking");
    await waitFor(() => expect(second.result.current).toBe("denied"));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("rootFolderId が変わったら、前の結果を使わず checking に戻る", async () => {
    jest
      .spyOn(ShareAreaApi.prototype, "getMyCenterAreas")
      .mockResolvedValue({ data: [area("A", true), area("B", false)] });
    const { result, rerender } = renderHook(
      ({ id }) => useAreaAdminGate(id),
      { wrapper: makeWrapper(), initialProps: { id: "A" } },
    );
    await waitFor(() => expect(result.current).toBe("allowed"));

    rerender({ id: "B" });
    expect(result.current).toBe("checking");
    await waitFor(() => expect(result.current).toBe("denied"));
  });

  it("rootFolderId が無いときは、取得せず checking のまま", () => {
    const spy = jest.spyOn(ShareAreaApi.prototype, "getMyCenterAreas");
    const { result } = renderHook(() => useAreaAdminGate(undefined), {
      wrapper: makeWrapper(),
    });
    expect(result.current).toBe("checking");
    expect(spy).not.toHaveBeenCalled();
  });

  it("ログインユーザー情報の読み込み前（userCd が空）は、API を呼ばず checking で待ち、読み込まれたら確認する", async () => {
    const spy = jest
      .spyOn(ShareAreaApi.prototype, "getMyCenterAreas")
      .mockResolvedValue({ data: [area("A", true)] });
    const { result } = renderHook(() => useAreaAdminGate("A"), {
      wrapper: makeWrapper(""),
    });
    expect(result.current).toBe("checking");
    expect(spy).not.toHaveBeenCalled();

    // ログインユーザーが確定したあと、userCd を付けて確認する
    act(() => {
      storeRef.current!.dispatch(userActions.setUserId("u001"));
    });
    await waitFor(() => expect(result.current).toBe("allowed"));
    expect(spy).toHaveBeenCalledWith("u001", expect.anything());
  });
});
