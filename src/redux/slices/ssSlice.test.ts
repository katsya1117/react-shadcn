import type { FolderInfo } from "@/types/ss";
import { initialSliceError } from "@/redux/common/error";

import { configureStore } from "@reduxjs/toolkit";
import { jest } from "@jest/globals";
import { BoxApi } from "@/api";
import {
  COLLABORATIONS_TTL_MS,
  configureCollaborationsCache,
  isCollaborationsCacheEnabled,
  ensureFolderCollaborations,
  ssActions,
  ssSelector,
  ssSliceReducer,
  getFolderCollaborations,
  createCollaborations,
  deleteCollaborations,
  updateCollaborations,
} from "./ssSlice";

describe("ssSlice", () => {
  it("rootFolderId ごとに currentFolder と履歴状態を保持できる", () => {
    const folder: FolderInfo = {
      id: "child-folder",
      name: "child",
      pathCollection: {
        entries: [
          { id: "root-folder", name: "root" },
          { id: "parent-folder", name: "parent" },
        ],
      },
    };

    const next = ssSliceReducer(
      ssSliceReducer(
        undefined,
        ssActions.setCurrentFolder({ rootFolderId: "root-folder", folder }),
      ),
      ssActions.setFolderHistory({
        rootFolderId: "root-folder",
        history: ["root-folder", "parent-folder", "child-folder"],
        index: 2,
      }),
    );

    expect(next.currentFolderByRootId["root-folder"]).toEqual(folder);
    expect(next.folderHistoryByRootId["root-folder"]).toEqual([
      "root-folder",
      "parent-folder",
      "child-folder",
    ]);
    expect(next.historyIndexByRootId["root-folder"]).toBe(2);
  });

  it("selectors で root ごとの復元 state を取得できる", () => {
    const folder: FolderInfo = {
      id: "root-folder",
      name: "root",
      pathCollection: { entries: [] },
    };
    const sliceState = ssSliceReducer(
      ssSliceReducer(
        undefined,
        ssActions.setCurrentFolder({ rootFolderId: "root-folder", folder }),
      ),
      ssActions.setFolderHistory({
        rootFolderId: "root-folder",
        history: ["root-folder"],
        index: 0,
      }),
    );
    const rootState = { ss: sliceState } as Parameters<
      ReturnType<typeof ssSelector.currentFolderSelector>
    >[0];

    expect(ssSelector.currentFolderSelector("root-folder")(rootState)).toEqual(
      folder,
    );
    expect(ssSelector.folderHistorySelector("root-folder")(rootState)).toEqual([
      "root-folder",
    ]);
    expect(ssSelector.historyIndexSelector("root-folder")(rootState)).toBe(0);
  });
});

describe("ssSlice reducers", () => {
  it("clearCurrentFolder: 指定 root のフォルダ情報を削除する", () => {
    const folder: FolderInfo = {
      id: "f1",
      name: "folder",
      pathCollection: { entries: [] },
    };
    const withFolder = ssSliceReducer(
      undefined,
      ssActions.setCurrentFolder({ rootFolderId: "root", folder }),
    );
    expect(withFolder.currentFolderByRootId["root"]).toEqual(folder);

    const cleared = ssSliceReducer(
      withFolder,
      ssActions.clearCurrentFolder("root"),
    );
    expect(cleared.currentFolderByRootId["root"]).toBeUndefined();
  });

  it("clearFolderHistory: 指定 root の履歴と index を削除する", () => {
    const withHistory = ssSliceReducer(
      undefined,
      ssActions.setFolderHistory({
        rootFolderId: "root",
        history: ["f1", "f2"],
        index: 1,
      }),
    );
    expect(withHistory.folderHistoryByRootId["root"]).toEqual(["f1", "f2"]);

    const cleared = ssSliceReducer(
      withHistory,
      ssActions.clearFolderHistory("root"),
    );
    expect(cleared.folderHistoryByRootId["root"]).toBeUndefined();
    expect(cleared.historyIndexByRootId["root"]).toBeUndefined();
  });
});

describe("getFolderCollaborations extraReducers", () => {
  it("pending: isLoading=true, error リセット, status=loading", () => {
    const action = getFolderCollaborations.pending("req1", "folder1");
    const state = ssSliceReducer(undefined, action);

    expect(state.isLoading).toBe(true);
    expect(state.error).toEqual(initialSliceError);
    expect(state.collaborationStatusByFolderId["folder1"]).toBe("loading");
  });

  it("fulfilled: データ保存, isLoading=false, status=succeeded", () => {
    const data = [{ id: "c1", role: "viewer" as const }] as any[];
    const action = getFolderCollaborations.fulfilled(
      { folderId: "folder1", data },
      "req1",
      "folder1",
    );
    const state = ssSliceReducer(undefined, action);

    expect(state.byFolderId["folder1"]).toEqual(data);
    expect(state.isLoading).toBe(false);
    expect(state.collaborationStatusByFolderId["folder1"]).toBe("succeeded");
  });

  it("fulfilled with null payload: エラーをセット, isLoading=false", () => {
    const action = getFolderCollaborations.fulfilled(
      null as any,
      "req1",
      "folder1",
    );
    const state = ssSliceReducer(undefined, action);

    expect(state.isLoading).toBe(false);
    expect(state.error.isError).toBe(true);
    expect(state.error.messages).toBeTruthy();
  });

  it("rejected: エラーをセット, isLoading=false, status=failed", () => {
    const action = getFolderCollaborations.rejected(
      new Error("network error"),
      "req1",
      "folder1",
    );
    const state = ssSliceReducer(undefined, action);

    expect(state.isLoading).toBe(false);
    expect(state.error.isError).toBe(true);
    expect(state.collaborationStatusByFolderId["folder1"]).toBe("failed");
  });
});

describe("createCollaborations / deleteCollaborations / updateCollaborations extraReducers", () => {
  it("createCollaborations pending/fulfilled/rejected で state は変わらない", () => {
    const base = ssSliceReducer(undefined, { type: "@@INIT" });

    const afterPending = ssSliceReducer(
      base,
      createCollaborations.pending("req", { folderId: "f", collaboratorId: "u", collaboratorType: "user", collaboratorName: "U", role: "viewer", can_view_path: true }),
    );
    expect(afterPending).toEqual(base);

    const afterFulfilled = ssSliceReducer(
      base,
      createCollaborations.fulfilled(undefined, "req", { folderId: "f", collaboratorId: "u", collaboratorType: "user", collaboratorName: "U", role: "viewer", can_view_path: true }),
    );
    expect(afterFulfilled).toEqual(base);

    const afterRejected = ssSliceReducer(
      base,
      createCollaborations.rejected(null, "req", { folderId: "f", collaboratorId: "u", collaboratorType: "user", collaboratorName: "U", role: "viewer", can_view_path: true }),
    );
    expect(afterRejected).toEqual(base);
  });

  it("deleteCollaborations pending/fulfilled/rejected で state は変わらない", () => {
    const base = ssSliceReducer(undefined, { type: "@@INIT" });

    const afterPending = ssSliceReducer(
      base,
      deleteCollaborations.pending("req", { collaborationId: "c1" }),
    );
    expect(afterPending).toEqual(base);

    const afterFulfilled = ssSliceReducer(
      base,
      deleteCollaborations.fulfilled(undefined, "req", { collaborationId: "c1" }),
    );
    expect(afterFulfilled).toEqual(base);

    const afterRejected = ssSliceReducer(
      base,
      deleteCollaborations.rejected(null, "req", { collaborationId: "c1" }),
    );
    expect(afterRejected).toEqual(base);
  });

  it("updateCollaborations pending/fulfilled/rejected で state は変わらない", () => {
    const base = ssSliceReducer(undefined, { type: "@@INIT" });
    const param = { collaborationId: "c1", params: { role: "editor" as const } };

    const afterPending = ssSliceReducer(base, updateCollaborations.pending("req", param));
    expect(afterPending).toEqual(base);

    const afterFulfilled = ssSliceReducer(base, updateCollaborations.fulfilled(undefined, "req", param));
    expect(afterFulfilled).toEqual(base);

    const afterRejected = ssSliceReducer(base, updateCollaborations.rejected(null, "req", param));
    expect(afterRejected).toEqual(base);
  });
});

describe("ssSelector デフォルト値", () => {
  const emptyState = { ss: ssSliceReducer(undefined, { type: "@@INIT" }) } as any;

  it("collaborationStatusSelector: 未登録フォルダは 'idle'", () => {
    expect(ssSelector.collaborationStatusSelector("unknown")(emptyState)).toBe("idle");
  });

  it("folderHistorySelector: 未登録フォルダは [rootFolderId]", () => {
    expect(ssSelector.folderHistorySelector("my-root")(emptyState)).toEqual([
      "my-root",
    ]);
  });

  it("historyIndexSelector: 未登録フォルダは 0", () => {
    expect(ssSelector.historyIndexSelector("my-root")(emptyState)).toBe(0);
  });

  it("isLoadingSelector: isLoading を返す", () => {
    const loadingState = {
      ss: ssSliceReducer(undefined, getFolderCollaborations.pending("r", "f")),
    } as any;
    expect(ssSelector.isLoadingSelector()(loadingState)).toBe(true);
    expect(ssSelector.isLoadingSelector()(emptyState)).toBe(false);
  });

  it("byFolderIdSelector と collaborationByFolderIdSelector は同じ byFolderId を返す", () => {
    const data = [{ id: "c1" }] as any[];
    const state = {
      ss: ssSliceReducer(
        undefined,
        getFolderCollaborations.fulfilled({ folderId: "f1", data }, "r", "f1"),
      ),
    } as any;

    expect(ssSelector.byFolderIdSelector()(state)).toEqual({ f1: data });
    expect(ssSelector.collaborationByFolderIdSelector()(state)).toEqual({ f1: data });
  });
});

describe("ensureFolderCollaborations（キャッシュが無効: 既定）", () => {
  const rows = [{ id: "c1" }] as never;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("既定ではキャッシュを使わず、毎回 Box から取得する", async () => {
    expect(isCollaborationsCacheEnabled()).toBe(false);
    const spy = jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({ data: rows });
    const store = configureStore({ reducer: { ss: ssSliceReducer } });

    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();
    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();

    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("ensureFolderCollaborations（一覧キャッシュ）", () => {
  const makeStore = () => configureStore({ reducer: { ss: ssSliceReducer } });
  const rows = [{ id: "c1" }] as never;

  // キャッシュは既定で無効。このブロックでは、有効にして検証する
  beforeEach(() => {
    configureCollaborationsCache({ enabled: true });
  });

  afterEach(() => {
    configureCollaborationsCache({ enabled: false });
    jest.restoreAllMocks();
  });

  it("未取得なら Box から取得し、TTL 内の 2 回目は取得しない", async () => {
    const spy = jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({ data: rows });
    const store = makeStore();

    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();
    const second = await store.dispatch(ensureFolderCollaborations("f1")).unwrap();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(second).toEqual(rows);
  });

  it("フォルダが違えば別々に取得する", async () => {
    const spy = jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({ data: rows });
    const store = makeStore();

    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();
    await store.dispatch(ensureFolderCollaborations("f2")).unwrap();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("TTL（5分）を過ぎたら取得し直す", async () => {
    const spy = jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({ data: rows });
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    const store = makeStore();

    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();
    now.mockReturnValue(1_000_000 + COLLABORATIONS_TTL_MS - 1);
    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();
    expect(spy).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000_000 + COLLABORATIONS_TTL_MS);
    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("invalidateCollaborations で全フォルダのキャッシュを破棄し、次は取得し直す", async () => {
    const spy = jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({ data: rows });
    const store = makeStore();
    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();
    await store.dispatch(ensureFolderCollaborations("f2")).unwrap();

    store.dispatch(ssActions.invalidateCollaborations());
    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();
    await store.dispatch(ensureFolderCollaborations("f2")).unwrap();

    expect(spy).toHaveBeenCalledTimes(4);
  });

  it("取得に失敗したときは reject し、キャッシュ扱いにしない", async () => {
    const spy = jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue({ data: rows });
    const store = makeStore();

    await expect(
      store.dispatch(ensureFolderCollaborations("f1")).unwrap(),
    ).rejects.toBeDefined();
    await store.dispatch(ensureFolderCollaborations("f1")).unwrap();

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
