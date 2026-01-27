import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";

import {
  CenterApi,
  type CenterCreationParams,
  type CenterInfo,
  type CenterSearchParams,
  type PaginationResultCenterListItem,
} from "../../api";

import Config from "../../config/apiConfig";
import {
  initialSliceError,
  rejectedMessage,
  setSliceError,
  type SliceError,
} from "../common/error";

import type { AppRootState } from "../store";

const sliceName = "center";

const api = new CenterApi(Config.apiConfig);

export const createCenter = createAsyncThunk(
  sliceName + "/createCenter",
  async (param: CenterCreationParams) => {
    const response = api.createCenter(
      param,
      Config.apiOption
    );
    return (await response).data;
  }
);

export const getCenterList = createAsyncThunk(
  sliceName + "/getCenterList",
  async (param: CenterSearchParams) => {
    const response = api.getCenterList(
      param.center_name,
      param.user_list,
      param.sort,
      param.order,
      param.page,
      param.per_page,
      Config.apiOption
    );
    return (await response).data;
  }
);

export const getCenterInfo = createAsyncThunk(
  sliceName + "/getCenterInfo",
  async (center_cd: string) => {
    const response = api.getCenter(center_cd, Config.apiOption);
    return (await response).data;
  }
);

interface CenterState {
  isLoading: boolean;
  error: SliceError;
  list: {
    searchCondition: CenterSearchParams | undefined;
    data: PaginationResultCenterListItem | undefined;
  };
  target: CenterInfo | undefined;
  create: {
    success: string;
  };
}

const initialState: CenterState = {
  isLoading: false,
  error: initialSliceError,
  list: {
    searchCondition: undefined,
    data: undefined,
  },
  target: undefined,
  create: {
    success: "",
  },
};

const centerSlice = createSlice({
  // slice名
  name: sliceName,
  // 初期値
  initialState: initialState,
  // 各reducer 第一引数でstate情報を受け取り、第二引数でユーザーが操作した情報を受け取る
  reducers: {
    resetCreate: (state) => {
      state.create = initialState.create;
    },
    resetCondition: (state) => {
      state.list.searchCondition = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // getCenterList
      .addCase(getCenterList.pending, (state, action) => {
        state.isLoading = true;
        state.error = initialSliceError;
        state.list.searchCondition = action.meta.arg;
      })
      .addCase(getCenterList.fulfilled, (state, action) => {
        if (action.payload != null) {
          state.list.data = action.payload;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload"
          );
        }
        state.isLoading = false;
      })
      .addCase(getCenterList.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });

    builder
      // getCenterInfo
      .addCase(getCenterInfo.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getCenterInfo.fulfilled, (state, action) => {
        if (action.payload != null) {
          state.target = action.payload;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload"
          );
        }
        state.isLoading = false;
      })
      .addCase(getCenterInfo.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });

    builder
      // createCenter
      .addCase(createCenter.pending, (state) => {
        state.create.success = "";
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(createCenter.fulfilled, (state, action) => {
        state.create.success = action.payload;
        if (!state.create.success) {
          state.error = setSliceError(
            "センターの作成に失敗しました。"
          );
        }
        state.isLoading = false;
      })
      .addCase(createCenter.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
  },
});

// action export
export const centerActions = centerSlice.actions;

// selector
const centerRootSelector = (state: AppRootState) => state.center;

export const centerSelector = {
  searchConditionSelector: () =>
    createSelector(centerRootSelector, (state) => {
      return state.list.searchCondition;
    }),

  centerListSelector: () =>
    createSelector(centerRootSelector, (state) => {
      return state.list.data;
    }),

  centerTargetSelector: () =>
    createSelector(centerRootSelector, (state) => {
      return state.target;
    }),

  centerCreateSelector: () =>
    createSelector(centerRootSelector, (state) => {
      return state.create;
    }),
};

// reducer export
export const centerSliceReducer = centerSlice.reducer;