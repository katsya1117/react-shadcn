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

/** コラボレーター一覧のキャッシュ有効時間（5分）。Box API の呼び出し回数を減らすために、この間は再取得しない。 */
export const COLLABORATIONS_TTL_MS = 5 * 60 * 1000;

/**
 * コラボレーター一覧のキャッシュ（TTL）の有効・無効。
 * 既定は無効: Box API の呼び出し回数が問題になるか未確認のため、暫定的に、性能と最新のデータを優先している。
 * 無効のとき、ensureFolderCollaborations は毎回 Box から取得する（他の処理は変わらない）。
 * 復活させるには、環境変数 VITE_BOX_COLLABORATIONS_CACHE=true（main.tsx）。
 */
let collaborationsCacheEnabled = false;

export const configureCollaborationsCache = (options: { enabled: boolean }) => {
  collaborationsCacheEnabled = options.enabled;
};

export const isCollaborationsCacheEnabled = () => collaborationsCacheEnabled;

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

/**
 * キャッシュが有効で、一覧が新しければ（TTL 内）取得済みの rows を返し、古い・未取得なら Box から取得する。
 * キャッシュが無効（既定）なら、毎回 Box から取得する。
 * キャッシュ破棄（invalidateCollaborations）後は必ず取得し直す。
 */
export const ensureFolderCollaborations = createAsyncThunk(
  sliceName + "/ensureFolderCollaborations",
  async (folderId: string, { dispatch, getState }) => {
    const { byFolderId, collaborationFetchedAtByFolderId } = (
      getState() as AppRootState
    ).ss;
    const rows = byFolderId[folderId];
    const fetchedAt = collaborationFetchedAtByFolderId[folderId];
    if (
      collaborationsCacheEnabled &&
      rows &&
      fetchedAt !== undefined &&
      Date.now() - fetchedAt < COLLABORATIONS_TTL_MS
    ) {
      return rows;
    }
    const result = await dispatch(getFolderCollaborations(folderId)).unwrap();
    return result.data;
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
  // フォルダごとの一覧の取得時刻（ms）。TTL 判定に使う。破棄すると未取得扱いになる。
  collaborationFetchedAtByFolderId: Record<string, number>;
  currentFolderByRootId: Record<string, FolderInfo | undefined>;
  folderHistoryByRootId: Record<string, string[]>;
  historyIndexByRootId: Record<string, number>;
  isLoading: boolean;
  error: SliceError;
}

const initialState: SSState = {
  byFolderId: {},
  collaborationStatusByFolderId: {},
  collaborationFetchedAtByFolderId: {},
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
    /**
     * 全フォルダの一覧キャッシュを破棄する（次回は必ず取得し直す）。
     * 一覧は親フォルダからの継承分も含むため、あるフォルダの変更は配下の一覧にも影響する。
     * 変更は頻繁ではないので、フォルダを絞らず全体を破棄する。
     */
    invalidateCollaborations: (state) => {
      state.collaborationFetchedAtByFolderId = {};
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
          state.collaborationFetchedAtByFolderId[folderId] = Date.now();
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
