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

const sliceName = "ss";

type AsyncStatus = "idle" | "pending" | "succeeded" | "failed";

type FolderArgs = {
  folderId: string;
  rootFolderId: string;
};

type AddCollaborationArgs = FolderArgs & {
  collaborator: Collaborator;
};

type RemoveCollaborationArgs = FolderArgs & {
  collaboratorId: string;
};

type UpdateCollaborationRoleArgs = FolderArgs & {
  collaboratorId: string;
  role: Collaborator["role"];
};

type SSSliceState = {
  byFolderId: Record<string, CollaborationState>;
  currentFolderByRootId: Record<string, FolderInfo | undefined>;
  fetchStatus: AsyncStatus;
  mutateStatus: AsyncStatus;
  error?: string;
};

const initialState: SSSliceState = {
  byFolderId: {},
  currentFolderByRootId: {},
  fetchStatus: "idle",
  mutateStatus: "idle",
  error: undefined,
};

export const buildRootDefaultCollaborators = (
  rootFolderId: string,
): Collaborator[] => [
  {
    id: `${rootFolderId}:department:tokyo`,
    type: "department",
    name: "東京センター",
    role: "editor",
    canViewPath: true,
    sourceFolderId: rootFolderId,
  },
  {
    id: `${rootFolderId}:user:sre`,
    type: "user",
    name: "sre-user",
    role: "viewer",
    canViewPath: true,
    sourceFolderId: rootFolderId,
  },
  {
    id: `${rootFolderId}:user:legacy`,
    type: "user",
    name: "legacy-user",
    role: "viewer",
    canViewPath: false,
    sourceFolderId: rootFolderId,
  },
];

const getDirectCollaborators = (
  state: SSSliceState,
  folderId: string,
  rootFolderId: string,
) =>
  state.byFolderId[folderId]?.direct ??
  (folderId === rootFolderId ? buildRootDefaultCollaborators(rootFolderId) : []);

export const getSSCollaborations = createAsyncThunk<
  { folderId: string; direct: Collaborator[] },
  FolderArgs,
  { state: AppRootState }
>(`${sliceName}/getCollaborations`, async ({ folderId, rootFolderId }, api) => {
  const state = api.getState().ss;

  return {
    folderId,
    direct: getDirectCollaborators(state, folderId, rootFolderId),
  };
});

export const addSSCollaborator = createAsyncThunk<
  { folderId: string; direct: Collaborator[] },
  AddCollaborationArgs,
  { state: AppRootState; rejectValue: string }
>(`${sliceName}/addCollaborator`, async (args, api) => {
  const state = api.getState().ss;
  const currentDirect = getDirectCollaborators(
    state,
    args.folderId,
    args.rootFolderId,
  );

  const alreadyExists = currentDirect.some(
    (collaborator) =>
      collaborator.type === args.collaborator.type &&
      collaborator.name === args.collaborator.name,
  );

  if (alreadyExists) {
    return api.rejectWithValue("同じコラボレーターは既に設定されています");
  }

  return {
    folderId: args.folderId,
    direct: [...currentDirect, args.collaborator],
  };
});

export const removeSSCollaborator = createAsyncThunk<
  { folderId: string; direct: Collaborator[] },
  RemoveCollaborationArgs,
  { state: AppRootState }
>(`${sliceName}/removeCollaborator`, async (args, api) => {
  const state = api.getState().ss;
  const currentDirect = getDirectCollaborators(
    state,
    args.folderId,
    args.rootFolderId,
  );

  return {
    folderId: args.folderId,
    direct: currentDirect.filter(
      (collaborator) => collaborator.id !== args.collaboratorId,
    ),
  };
});

export const updateSSCollaboratorRole = createAsyncThunk<
  { folderId: string; direct: Collaborator[] },
  UpdateCollaborationRoleArgs,
  { state: AppRootState; rejectValue: string }
>(`${sliceName}/updateCollaboratorRole`, async (args, api) => {
  const state = api.getState().ss;
  const currentDirect = getDirectCollaborators(
    state,
    args.folderId,
    args.rootFolderId,
  );
  const target = currentDirect.find(
    (collaborator) => collaborator.id === args.collaboratorId,
  );

  if (!target) {
    return api.rejectWithValue("対象のコラボレーターが見つかりません");
  }

  return {
    folderId: args.folderId,
    direct: currentDirect.map((collaborator) =>
      collaborator.id === args.collaboratorId
        ? { ...collaborator, role: args.role }
        : collaborator,
    ),
  };
});

const ssSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setCurrentFolder: (
      state,
      action: PayloadAction<{ rootFolderId: string; folder: FolderInfo }>,
    ) => {
      state.currentFolderByRootId[action.payload.rootFolderId] =
        action.payload.folder;
    },
    clearCurrentFolder: (state, action: PayloadAction<string>) => {
      delete state.currentFolderByRootId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSSCollaborations.pending, (state) => {
        state.fetchStatus = "pending";
        state.error = undefined;
      })
      .addCase(getSSCollaborations.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.byFolderId[action.payload.folderId] = {
          direct: action.payload.direct,
        };
      })
      .addCase(getSSCollaborations.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(addSSCollaborator.pending, (state) => {
        state.mutateStatus = "pending";
        state.error = undefined;
      })
      .addCase(addSSCollaborator.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.byFolderId[action.payload.folderId] = {
          direct: action.payload.direct,
        };
      })
      .addCase(addSSCollaborator.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.error = action.payload ?? action.error.message;
      })
      .addCase(removeSSCollaborator.pending, (state) => {
        state.mutateStatus = "pending";
        state.error = undefined;
      })
      .addCase(removeSSCollaborator.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.byFolderId[action.payload.folderId] = {
          direct: action.payload.direct,
        };
      })
      .addCase(removeSSCollaborator.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(updateSSCollaboratorRole.pending, (state) => {
        state.mutateStatus = "pending";
        state.error = undefined;
      })
      .addCase(updateSSCollaboratorRole.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.byFolderId[action.payload.folderId] = {
          direct: action.payload.direct,
        };
      })
      .addCase(updateSSCollaboratorRole.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.error = action.payload ?? action.error.message;
      });
  },
});

const ssRootSelector = (state: AppRootState) => state.ss;

export const ssSelector = {
  byFolderIdSelector: () =>
    createSelector(ssRootSelector, (state) => state.byFolderId),
  currentFolderSelector: (rootFolderId: string) =>
    createSelector(
      ssRootSelector,
      (state) => state.currentFolderByRootId[rootFolderId],
    ),
  fetchStatusSelector: () =>
    createSelector(ssRootSelector, (state) => state.fetchStatus),
  mutateStatusSelector: () =>
    createSelector(ssRootSelector, (state) => state.mutateStatus),
  isMutatingSelector: () =>
    createSelector(ssRootSelector, (state) => state.mutateStatus === "pending"),
  errorSelector: () => createSelector(ssRootSelector, (state) => state.error),
};

export const ssActions = ssSlice.actions;
export const ssSliceReducer = ssSlice.reducer;
