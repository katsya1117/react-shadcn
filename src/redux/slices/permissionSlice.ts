import type { DefaultSelection36PermissionPayload } from "@/api";
import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import type { AppRootState } from "@/redux/store";

const sliceName = "permission";

export const getPermissionList = createAsyncThunk(
  `${sliceName}/getPermissionList`,
  async () => {
    const { mockPermissions } = await import("@/api/mock/permissionsDb");
    await new Promise((r) => setTimeout(r, 20));
    return mockPermissions;
  },
);

type PermissionState = {
  permissionList: DefaultSelection36PermissionPayload[] | null;
};

const initialState: PermissionState = {
  permissionList: null,
};

export const permissionSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getPermissionList.fulfilled, (state, action) => {
      state.permissionList = action.payload;
    });
  },
});

const permissionRootSelector = (state: AppRootState) => state.permission;

export const permissionSelector = {
  permListSelector: () =>
    createSelector(permissionRootSelector, (state) => state.permissionList),
};

export const permissionReducer = permissionSlice.reducer;
export default permissionSlice.reducer;
