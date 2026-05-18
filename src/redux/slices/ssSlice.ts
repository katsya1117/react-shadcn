import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type { AppRootState } from "@/redux/store";
import type { FolderInfo } from "@/types/ss";
import { BoxApi } from "@/api";
import Config from "@/config/apiConfig";
import type {
  GetFolderCollaborationsResponse,
  CreateCollaborationsParams,
  UpdateCollaborationParams,
} from "@/api";
import type { SliceError } from "@/redux/common/error";
import {
  initialSliceError,
  setSliceError,
  rejectedMessage,
  parseApiError,
} from "@/redux/common/error";

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
  async (param: CreateCollaborationsParams, { rejectWithValue }) => {
    try {
      await api.createCollaborations(param, Config.apiOption);
    } catch (e) {
      return rejectWithValue(parseApiError(e));
    }
  },
);

export const deleteCollaborations = createAsyncThunk(
  sliceName + "/deleteCollaborations",
  async (param: { collaborationId: string }, { rejectWithValue }) => {
    try {
      await api.deleteCollaborations(param.collaborationId, Config.apiOption);
    } catch (e) {
      return rejectWithValue(parseApiError(e));
    }
  },
);

export const updateCollaborations = createAsyncThunk(
  sliceName + "/updateCollaborations",
  async (
    param: { collaborationId: string; params: UpdateCollaborationParams },
    { rejectWithValue },
  ) => {
    try {
      await api.updateCollaboration(
        param.collaborationId,
        param.params,
        Config.apiOption,
      );
    } catch (e) {
      return rejectWithValue(parseApiError(e));
    }
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
      .addCase(createCollaborations.pending, () => {
        // state.error = initialSliceError;
      })
      .addCase(createCollaborations.fulfilled, () => {})
      .addCase(createCollaborations.rejected, () => {
        // state.error = setSliceError(
        //   typeof action.payload === "string" ? action.payload : rejectedMessage,
        // );
      });
    builder
      .addCase(deleteCollaborations.pending, () => {
        // state.error = initialSliceError;
      })
      .addCase(deleteCollaborations.fulfilled, () => {})
      .addCase(deleteCollaborations.rejected, () => {
        // state.error = setSliceError(
        //   typeof action.payload === "string" ? action.payload : rejectedMessage,
        // );
      });
    builder
      .addCase(updateCollaborations.pending, () => {
        // state.error = initialSliceError;
      })
      .addCase(updateCollaborations.fulfilled, () => {})
      .addCase(updateCollaborations.rejected, () => {
        // state.error = setSliceError(
        //   typeof action.payload === "string" ? action.payload : rejectedMessage,
        // );
      });
  },
});

export const ssActions = ssSlice.actions;

// Singular-name aliases for ss2.tsx compatibility
export const createCollaboration = createCollaborations;
export const deleteCollaboration = deleteCollaborations;
export const updateCollaboration = updateCollaborations;

const ssRootSelector = (state: AppRootState) => state.ss;

export const ssSelector = {
  isLoadingSelector: () =>
    createSelector(ssRootSelector, (state) => state.isLoading),
  byFolderIdSelector: () =>
    createSelector(ssRootSelector, (state) => state.byFolderId),
  collaborationByFolderIdSelector: () =>
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
