import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type { AppRootState } from "../store";
import type {
  CollaborationState,
  Collaborator,
  FolderInfo,
} from "@/components/ss/types";
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
    const response = api.getFolderCollaborations(folderId, Config.apiOption);
    return {
      folderId,
      data: (await response).data as GetFolderCollaborationsResponse[],
    };
  },
);

export const createCollaborations = createAsyncThunk(
  sliceName + "/createCollaborations",
  async (param: CreateCollaborationParams, { dispatch }) => {
    await api.createCollaborations(param, Config.apiOption);
    await dispatch(getFolderCollaborations(param.folderId));
    return param.folderId;
  },
);

export const deleteCollaborations = createAsyncThunk(
  sliceName + "/deleteCollaborations",
  async (
    param: { folderId: string; collaborationId: string },
    { dispatch },
  ) => {
    await api.deleteCollaborations(param.collaborationId, Config.apiOption);
    await dispatch(getFolderCollaborations(param.folderId));
    return param.folderId;
  },
);

export const updateCollaborations = createAsyncThunk(
  sliceName + "/updateCollaborations",
  async (
    param: {
      folderId: string;
      collaborationId: string;
      params: UpdateCollaborationParams;
    },
    { dispatch },
  ) => {
    await api.updateCollaboration(
      param.collaborationId,
      param.params,
      Config.apiOption,
    );
    await dispatch(getFolderCollaborations(param.folderId));
    return param.folderId;
  },
);

interface SSState {
  byFolderId: Record<string, Collaborator[]>;
  currentFolderByRootId: Record<string, FolderInfo | undefined>;
  isLoading: boolean;
  error: SliceError;
}

const initialState: SSState = {
  byFolderId: {},
  currentFolderByRootId: {},
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
    clearCurrentFolder: (state, action: PayloadAction<string>) => {
      delete state.currentFolderByRootId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFolderCollaborations.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getFolderCollaborations.fulfilled, (state, action) => {
        if (action.payload !== null) {
          const { folderId, data } = action.payload;
          state.byFolderId[folderId] = data;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(getFolderCollaborations.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
    builder
      .addCase(createCollaborations.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(createCollaborations.fulfilled, (state, action) => {
        if (action.payload !== null) {
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
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
      .addCase(deleteCollaborations.fulfilled, (state, action) => {
        if (action.payload !== null) {
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
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
      .addCase(updateCollaborations.fulfilled, (state, action) => {
        if (action.payload !== null) {
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(updateCollaborations.rejected, (state, action) => {
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
  currentFolderSelector: (rootFolderId: string) =>
    createSelector(
      ssRootSelector,
      (state) => state.currentFolderByRootId[rootFolderId],
    ),
};

export const ssSliceReducer = ssSlice.reducer;
