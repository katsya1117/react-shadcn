import type { FolderInfo } from "@/types/ss";
import { initialSliceError } from "@/redux/common/error";

import {
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
