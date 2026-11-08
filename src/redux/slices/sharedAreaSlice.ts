import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";

import { ShareAreaApi, type SharedAreaItem } from "@/api";
import Config from "@/config/apiConfig";
import {
  initialSliceError,
  rejectedMessage,
  setSliceError,
  type SliceError,
} from "@/redux/common/error";

import type { AppRootState } from "@/redux/store";

const sliceName = "sharedArea";

const api = new ShareAreaApi(Config.apiConfig);

/** 他センターから共有された領域の一覧を取得する（ランチャーを開くたびに呼ぶ） */
export const getSharedAreas = createAsyncThunk(
  sliceName + "/getSharedAreas",
  async (userCd: string) => {
    const response = await api.getSharedAreas(userCd, Config.apiOption);
    return response.data;
  },
);

interface SharedAreaState {
  isLoading: boolean;
  error: SliceError;
  items: SharedAreaItem[];
  /** 一度でも取得できたか。取得前の「0 件」表示を避けるために使う */
  loaded: boolean;
}

const initialState: SharedAreaState = {
  isLoading: false,
  error: initialSliceError,
  items: [],
  loaded: false,
};

const sharedAreaSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSharedAreas.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getSharedAreas.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.loaded = true;
      })
      .addCase(getSharedAreas.rejected, (state, action) => {
        state.isLoading = false;
        state.error = setSliceError(
          action.error.message ?? rejectedMessage,
        );
      });
  },
});

const sharedAreaRootSelector = (state: AppRootState) => state.sharedArea;

export const sharedAreaSelector = {
  itemsSelector: () =>
    createSelector(sharedAreaRootSelector, (state) => state.items),
  isLoadingSelector: () =>
    createSelector(sharedAreaRootSelector, (state) => state.isLoading),
  loadedSelector: () =>
    createSelector(sharedAreaRootSelector, (state) => state.loaded),
  errorSelector: () =>
    createSelector(sharedAreaRootSelector, (state) => state.error),
};

export const sharedAreaSliceReducer = sharedAreaSlice.reducer;
