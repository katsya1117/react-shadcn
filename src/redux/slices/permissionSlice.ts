import type { DefaultSelection36PermissionPayload } from "@/api";
import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import type { AppRootState } from "../store";

const sliceName = "permission";

// 簡易モックデータ
const mockPermList: DefaultSelection36PermissionPayload[] = [
  {
    perm_cd: "standard",
    perm_name: "標準",
    can_job_create: 1,
    can_status_import: 1,
    can_access_authority: 1,
    can_status_change: 1,
    can_job_change_expiry: 0,
    can_job_change: 1,
    can_status_reissue: 0,
    can_job_arrow_user: 0,
    can_log_search: 1,
    can_manage: 0,
    can_ng_word: 0,
    can_auto_delete: 0,
    search_cd1: 1,
    search_cd2: 2,
    search_cd3: 3,
  },
  {
    perm_cd: "admin",
    perm_name: "管理者",
    can_job_create: 1,
    can_status_import: 1,
    can_access_authority: 1,
    can_status_change: 1,
    can_job_change_expiry: 1,
    can_job_change: 1,
    can_status_reissue: 1,
    can_job_arrow_user: 1,
    can_log_search: 1,
    can_manage: 1,
    can_ng_word: 1,
    can_auto_delete: 1,
    search_cd1: 4,
    search_cd2: 5,
    search_cd3: 6,
  },
];

export const getPermissionList = createAsyncThunk(
  `${sliceName}/getPermissionList`,
  async () => {
    await new Promise((r) => setTimeout(r, 20));
    return mockPermList;
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
