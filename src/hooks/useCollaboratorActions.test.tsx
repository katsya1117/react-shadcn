import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { act, renderHook } from "@testing-library/react";

import { BoxApi } from "@/api";
import { toast } from "@/components/ui/sonner";
import { autoCompleteSliceReducer } from "@/redux/slices/autoCompleteSlice";
import { ssSliceReducer } from "@/redux/slices/ssSlice";
import type { Collaborator } from "@/types/ss";
import { useCollaboratorActions } from "./useCollaboratorActions";

jest.mock("@/components/ui/sonner");

// コラボレーターの追加・削除・ロール更新（useCollaboratorActions）の検証。
// Box API をスパイで差し替え、「API → 一覧の更新（refresh）→ 通知」の流れと、実行中フラグ・フォームの状態を確認する。
// 画面（SS）を経由しないので、パネルのスタブやルーターは要らない。

const FOLDER_ID = "f1";

const makeWrapper = (groups: { label: string; value: string }[] = []) => {
  const store = configureStore({
    reducer: { ss: ssSliceReducer, autoComplete: autoCompleteSliceReducer },
    preloadedState: {
      ss: ssSliceReducer(undefined, { type: "@@INIT" }),
      autoComplete: {
        ...autoCompleteSliceReducer(undefined, { type: "@@INIT" }),
        groups,
      },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return Wrapper;
};

const collaborator: Collaborator = {
  id: "c1",
  name: "User1",
  type: "user",
  role: "viewer",
  canEdit: true,
  sourceFolderId: FOLDER_ID,
};

const setupHook = (
  options: {
    refresh?: () => Promise<void>;
    folderId?: string;
    groups?: { label: string; value: string }[];
  } = {},
) => {
  const refresh = options.refresh ?? jest.fn(() => Promise.resolve());
  const hook = renderHook(
    ({ folderId }: { folderId: string }) =>
      useCollaboratorActions({ currentFolderId: folderId, refresh }),
    {
      wrapper: makeWrapper(options.groups),
      initialProps: { folderId: options.folderId ?? FOLDER_ID },
    },
  );
  return { ...hook, refresh };
};

const selectNewUser = (result: ReturnType<typeof setupHook>["result"]) =>
  act(() => {
    result.current.setSelectedCollaborator({ value: "new-user", label: "New User" });
  });

beforeEach(() => {
  jest
    .spyOn(BoxApi.prototype, "getFolderCollaborations")
    .mockResolvedValue({ data: [] });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("useCollaboratorActions: 追加", () => {
  it("相手が未選択なら、何もしない", async () => {
    const { result, refresh } = setupHook();
    await act(() => result.current.add());
    expect(toast.error).not.toHaveBeenCalled();
    expect(BoxApi.prototype.getFolderCollaborations).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("成功したら、一覧を更新して通知し、フォームを初期値に戻す", async () => {
    const create = jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockResolvedValue({ data: {} as never });
    const { result, refresh } = setupHook();
    selectNewUser(result);
    act(() => result.current.setSelectedRole("editor"));

    await act(() => result.current.add());

    expect(create).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("New User を追加しました");
    expect(result.current.selectedCollaborator).toBeNull();
    expect(result.current.selectedRole).toBe("viewer");
  });

  it("グループから選んだ相手は、department として登録する", async () => {
    const create = jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockResolvedValue({ data: {} as never });
    const { result } = setupHook({ groups: [{ label: "Team", value: "g1" }] });
    act(() => {
      result.current.setSelectedCollaborator({ value: "g1", label: "Team" });
    });

    await act(() => result.current.add());

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collaboratorId: "g1",
        collaboratorType: "department",
        can_view_path: true,
      }),
      expect.anything(), // リクエストのオプション（ヘッダ）
    );
  });

  it("すでに設定済みの相手なら、通知だけ出して登録しない", async () => {
    jest.spyOn(BoxApi.prototype, "getFolderCollaborations").mockResolvedValue({
      data: [
        {
          id: "c-exist",
          accessible_by: { id: "new-user", name: "New User", type: "user" },
          role: "viewer",
          can_view_path: true,
        } as never,
      ],
    });
    const create = jest.spyOn(BoxApi.prototype, "createCollaborations");
    const { result, refresh } = setupHook();
    selectNewUser(result);

    await act(() => result.current.add());

    expect(toast.error).toHaveBeenCalledWith("同じコラボレーターは既に設定されています");
    expect(create).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    // 失敗したときは、入力を残す（やり直せるように）
    expect(result.current.selectedCollaborator).not.toBeNull();
  });

  it("重複チェックのための一覧取得に失敗したら、通知して登録しない", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockRejectedValue(new Error("fetch fail"));
    const create = jest.spyOn(BoxApi.prototype, "createCollaborations");
    const { result } = setupHook();
    selectNewUser(result);

    await act(() => result.current.add());

    expect(toast.error).toHaveBeenCalledWith("コラボレーター一覧の取得に失敗しました");
    expect(create).not.toHaveBeenCalled();
    expect(result.current.isMutating).toBe(false);
  });

  it("API が失敗したら、通知して、一覧は更新せず、入力を残す", async () => {
    jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockRejectedValue(new Error("create fail"));
    const { result, refresh } = setupHook();
    selectNewUser(result);

    await act(() => result.current.add());

    expect(toast.error).toHaveBeenCalledWith("予期せぬエラーが発生しました。");
    expect(toast.success).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.selectedCollaborator).not.toBeNull();
  });

  it("API は成功して一覧の更新に失敗したら、その旨を通知し、入力は残す", async () => {
    jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockResolvedValue({ data: {} as never });
    const refresh = jest.fn(() => Promise.reject(new Error("refresh fail")));
    const { result } = setupHook({ refresh });
    selectNewUser(result);

    await act(() => result.current.add());

    expect(toast.error).toHaveBeenCalledWith("追加は完了しましたが一覧の更新に失敗しました");
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.selectedCollaborator).not.toBeNull();
    expect(result.current.isMutating).toBe(false);
  });
});

describe("useCollaboratorActions: 削除", () => {
  it("成功したら、一覧を更新して通知する", async () => {
    const del = jest
      .spyOn(BoxApi.prototype, "deleteCollaborations")
      .mockResolvedValue({ data: true });
    const { result, refresh } = setupHook();

    await act(() => result.current.remove(collaborator));

    expect(del).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("User1 を削除しました");
  });

  it("失敗したら、エラーの中身に関わらず固定の文言で通知する", async () => {
    jest
      .spyOn(BoxApi.prototype, "deleteCollaborations")
      .mockRejectedValue(new Error("delete fail"));
    const { result, refresh } = setupHook();

    await act(() => result.current.remove(collaborator));

    expect(toast.error).toHaveBeenCalledWith("コラボレーターの削除に失敗しました");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("API は成功して一覧の更新に失敗したら、その旨を通知する", async () => {
    jest
      .spyOn(BoxApi.prototype, "deleteCollaborations")
      .mockResolvedValue({ data: true });
    const refresh = jest.fn(() => Promise.reject(new Error("refresh fail")));
    const { result } = setupHook({ refresh });

    await act(() => result.current.remove(collaborator));

    expect(toast.error).toHaveBeenCalledWith("削除は完了しましたが一覧の更新に失敗しました");
  });
});

describe("useCollaboratorActions: ロール更新", () => {
  it("成功したら、一覧を更新して通知する", async () => {
    const update = jest
      .spyOn(BoxApi.prototype, "updateCollaboration")
      .mockResolvedValue({ data: {} as never });
    const { result, refresh } = setupHook();

    await act(() => result.current.updateRole(collaborator, "editor"));

    expect(update).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("User1 のロールを更新しました");
  });

  it("失敗したら、通知して、一覧は更新しない", async () => {
    jest
      .spyOn(BoxApi.prototype, "updateCollaboration")
      .mockRejectedValue(new Error("update fail"));
    const { result, refresh } = setupHook();

    await act(() => result.current.updateRole(collaborator, "editor"));

    expect(toast.error).toHaveBeenCalledWith("予期せぬエラーが発生しました。");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("API は成功して一覧の更新に失敗したら、その旨を通知する", async () => {
    jest
      .spyOn(BoxApi.prototype, "updateCollaboration")
      .mockResolvedValue({ data: {} as never });
    const refresh = jest.fn(() => Promise.reject(new Error("refresh fail")));
    const { result } = setupHook({ refresh });

    await act(() => result.current.updateRole(collaborator, "editor"));

    expect(toast.error).toHaveBeenCalledWith("更新は完了しましたが一覧の更新に失敗しました");
  });
});

describe("useCollaboratorActions: 実行中フラグ", () => {
  it("操作の実行中は true、終わると false に戻る", async () => {
    let resolveDelete!: (v: { data: boolean }) => void;
    jest.spyOn(BoxApi.prototype, "deleteCollaborations").mockReturnValue(
      new Promise((r) => {
        resolveDelete = r;
      }),
    );
    const { result } = setupHook();
    expect(result.current.isMutating).toBe(false);

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.remove(collaborator);
    });
    expect(result.current.isMutating).toBe(true);

    await act(async () => {
      resolveDelete({ data: true });
      await pending;
    });
    expect(result.current.isMutating).toBe(false);
  });

  it("操作が重なったら、最後の 1 件が終わるまで true のまま", async () => {
    const resolvers: Array<(v: { data: boolean }) => void> = [];
    jest.spyOn(BoxApi.prototype, "deleteCollaborations").mockImplementation(
      () =>
        new Promise((r) => {
          resolvers.push(r);
        }),
    );
    const { result } = setupHook();

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.remove(collaborator);
      second = result.current.remove({ ...collaborator, id: "c2" });
    });

    await act(async () => {
      resolvers[0]({ data: true });
      await first;
    });
    expect(result.current.isMutating).toBe(true);

    await act(async () => {
      resolvers[1]({ data: true });
      await second;
    });
    expect(result.current.isMutating).toBe(false);
  });
});

describe("useCollaboratorActions: フォーム", () => {
  it("フォルダが変わったら、入力中の内容を初期値に戻す", () => {
    const { result, rerender } = setupHook();
    selectNewUser(result);
    act(() => result.current.setSelectedRole("editor"));
    expect(result.current.selectedCollaborator).not.toBeNull();

    rerender({ folderId: "f2" });

    expect(result.current.selectedCollaborator).toBeNull();
    expect(result.current.selectedRole).toBe("viewer");
  });

  it("同じフォルダのまま再描画しても、入力は消えない", () => {
    const { result, rerender } = setupHook();
    selectNewUser(result);

    rerender({ folderId: FOLDER_ID });

    expect(result.current.selectedCollaborator).not.toBeNull();
  });
});
