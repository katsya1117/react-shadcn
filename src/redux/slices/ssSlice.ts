import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type { AppRootState } from "../store";
import type { FolderInfo } from "@/components/ss/types";
import { BoxApi } from "@/api";
import Config from "@/config/apiConfig";
import type {
  GetFolderCollaborationsResponse,
  CreateCollaborationsParams,
  UpdateCollaborationParams,
} from "../../api/";
import type { SliceError } from "../common/error";
import {
  initialSliceError,
  setSliceError,
  rejectedMessage,
} from "../common/error";

const sliceName = "ss";

const api = new BoxApi(Config.apiConfig);

export const getFolderCollaborations = createAsyncThunk(
  sliceName + "/getFolderCollaborations",
  async (folderId: string) => {
    // collaborations 一覧だけは folderId ごとに store へ保持する。
    // 画面側は byFolderId[currentFolder.id] を読み、direct / inherited の判定は component で行う。
    const response = api.getFolderCollaborations(folderId, Config.apiOption);
    return {
      folderId,
      data: (await response).data as GetFolderCollaborationsResponse[],
    };
  },
);

export const createCollaborations = createAsyncThunk(
  sliceName + "/createCollaborations",
  async (param: CreateCollaborationsParams) => {
    // mutation thunk は API 呼び出しだけを責務にする。
    // 一覧再取得と toast 制御は component 側で unwrap + try/catch して扱う。
    await api.createCollaborations(param, Config.apiOption);
  },
);

export const deleteCollaborations = createAsyncThunk(
  sliceName + "/deleteCollaborations",
  async (param: { collaborationId: string }) => {
    // Box API の削除対象は collaborator 本体ではなく collaboration レコード ID。
    await api.deleteCollaborations(param.collaborationId, Config.apiOption);
  },
);

export const updateCollaborations = createAsyncThunk(
  sliceName + "/updateCollaborations",
  async (
    param: {
      collaborationId: string;
      params: UpdateCollaborationParams;
    },
  ) => {
    // ロール更新も collaborationId 単位。
    // inherited 行を触る場合は、継承元にある collaboration レコードを更新することになる。
    await api.updateCollaboration(
      param.collaborationId,
      param.params,
      Config.apiOption,
    );
  },
);

interface SSState {
  // Box から返ってきた raw row を folderId ごとに保持する。
  // 親フォルダを別途走査せず、current folder のレスポンスに含まれる inherited 情報をそのまま使う。
  byFolderId: Record<string, GetFolderCollaborationsResponse[]>;
  collaborationStatusByFolderId: Record<
    string,
    "idle" | "loading" | "succeeded" | "failed"
  >;
  currentFolderByRootId: Record<string, FolderInfo | undefined>;
  folderHistoryByRootId: Record<string, string[]>;
  historyIndexByRootId: Record<string, number>;
  isLoading: boolean;
  error: SliceError;
}

const initialState: SSState = {
  byFolderId: {},
  collaborationStatusByFolderId: {},
  currentFolderByRootId: {},
  folderHistoryByRootId: {},
  historyIndexByRootId: {},
  isLoading: false,
  error: initialSliceError,
};

const ssSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setCurrentFolder: (
      state,
      action: PayloadAction<{ rootFolderId: string; folder: FolderInfo }>,
    ) => {
      const { rootFolderId, folder } = action.payload;
      state.currentFolderByRootId[rootFolderId] = folder;
    },
    setFolderHistory: (
      state,
      action: PayloadAction<{
        rootFolderId: string;
        history: string[];
        index: number;
      }>,
    ) => {
      const { rootFolderId, history, index } = action.payload;
      state.folderHistoryByRootId[rootFolderId] = history;
      state.historyIndexByRootId[rootFolderId] = index;
    },
    clearCurrentFolder: (state, action: PayloadAction<string>) => {
      delete state.currentFolderByRootId[action.payload];
    },
    clearFolderHistory: (state, action: PayloadAction<string>) => {
      delete state.folderHistoryByRootId[action.payload];
      delete state.historyIndexByRootId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFolderCollaborations.pending, (state, action) => {
        state.isLoading = true;
        state.error = initialSliceError;
        state.collaborationStatusByFolderId[action.meta.arg] = "loading";
      })
      .addCase(getFolderCollaborations.fulfilled, (state, action) => {
        if (action.payload !== null) {
          const { folderId, data } = action.payload;
          state.byFolderId[folderId] = data;
          state.collaborationStatusByFolderId[folderId] = "succeeded";
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(getFolderCollaborations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
        state.collaborationStatusByFolderId[action.meta.arg] = "failed";
      });
    builder
      .addCase(createCollaborations.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(createCollaborations.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createCollaborations.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
    builder
      .addCase(deleteCollaborations.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(deleteCollaborations.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteCollaborations.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
    builder
      .addCase(updateCollaborations.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(updateCollaborations.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateCollaborations.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
  },
});

export const ssActions = ssSlice.actions;

const ssRootSelector = (state: AppRootState) => state.ss;

export const ssSelector = {
  isLoadingSelector: () =>
    createSelector(ssRootSelector, (state) => state.isLoading),
  byFolderIdSelector: () =>
    createSelector(ssRootSelector, (state) => state.byFolderId),
  collaborationStatusSelector: (folderId: string) =>
    createSelector(
      ssRootSelector,
      (state) => state.collaborationStatusByFolderId[folderId] ?? "idle",
    ),
  currentFolderSelector: (rootFolderId: string) =>
    createSelector(
      ssRootSelector,
      (state) => state.currentFolderByRootId[rootFolderId],
    ),
  folderHistorySelector: (rootFolderId: string) =>
    createSelector(
      ssRootSelector,
      (state) => state.folderHistoryByRootId[rootFolderId] ?? [rootFolderId],
    ),
  historyIndexSelector: (rootFolderId: string) =>
    createSelector(
      ssRootSelector,
      (state) => state.historyIndexByRootId[rootFolderId] ?? 0,
    ),
};

export const ssSliceReducer = ssSlice.reducer;
