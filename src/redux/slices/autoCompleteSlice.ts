import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";

import Config from "@/config/apiConfig";
import { AutoCompleteApi } from "@/api";
import type { AutoCompleteData } from "@/api";
import {
  initialSliceError,
  rejectedMessage,
  setSliceError,
  type SliceError,
} from "@/redux/common/error";
import type { AppRootState } from "@/redux/store";

const sliceName = "autoComplete";

const api = new AutoCompleteApi(Config.apiConfig);

export const getAutoComplete = createAsyncThunk(
  sliceName + "/getList",
  async () => {
    const res = await api.getList();
    return res.data;
  },
);

interface AutoCompleteState {
  isLoading: boolean;
  error: SliceError;
  users: AutoCompleteData[];
  groups: AutoCompleteData[];
}

const initialState: AutoCompleteState = {
  isLoading: false,
  error: initialSliceError,
  users: [],
  groups: [],
};

const autoCompleteSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAutoComplete.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
        state.users = [];
        state.groups = [];
      })
      .addCase(getAutoComplete.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.users = action.payload.users;
          state.groups = action.payload.groups;
        } else {
          state.error = setSliceError("データの取得に失敗しました。", "payload");
        }
        state.isLoading = false;
      })
      .addCase(getAutoComplete.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
  },
});

export const autoCompleteActions = autoCompleteSlice.actions;

const autoCompleteRootSelector = (state: AppRootState) => state.autoComplete;

export const autoCompleteSelector = {
  usersSelector: () =>
    createSelector(autoCompleteRootSelector, (state) => state.users),

  groupsSelector: () =>
    createSelector(autoCompleteRootSelector, (state) => state.groups),

  userGroupSelector: () =>
    createSelector(autoCompleteRootSelector, (state) =>
      state.groups.concat(state.users),
    ),
};

export const autoCompleteSliceReducer = autoCompleteSlice.reducer;
export const autoCompleteReducer = autoCompleteSlice.reducer;
export default autoCompleteSlice.reducer;
