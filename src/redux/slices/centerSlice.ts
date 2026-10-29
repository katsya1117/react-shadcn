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
  type CenterUpdateParams,
  type PaginationResultCenterListItem,
} from "@/api";

import Config from "@/config/apiConfig";
import {
  initialSliceError,
  parseApiError,
  rejectedMessage,
  setSliceError,
  type SliceError,
} from "@/redux/common/error";

import type { AppRootState } from "@/redux/store";

const sliceName = "center";

const api = new CenterApi(Config.apiConfig);

/** センター作成 Action（作成した center_cd を返す） */
export const createCenter = createAsyncThunk(
  sliceName + "/createCenter",
  async (param: CenterCreationParams, { rejectWithValue }) => {
    try {
      const response = await api.createCenter(param, Config.apiOption);
      return response.data;
    } catch (e) {
      return rejectWithValue(
        parseApiError(e, e instanceof Error ? e.message : undefined),
      );
    }
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

/** センター更新 Action */
export const updateCenterInfo = createAsyncThunk(
  sliceName + "/updateCenterInfo",
  async (
    param: { centerCd: string; params: CenterUpdateParams },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.updateCenter(
        param.centerCd,
        param.params,
        Config.apiOption,
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(
        parseApiError(e, e instanceof Error ? e.message : undefined),
      );
    }
  }
);

/** センター削除 Action */
export const removeCenter = createAsyncThunk(
  sliceName + "/removeCenter",
  async (centerCd: string, { rejectWithValue }) => {
    try {
      const response = await api.removeCenter(centerCd, Config.apiOption);
      return response.data;
    } catch (e) {
      return rejectWithValue(
        parseApiError(e, e instanceof Error ? e.message : undefined),
      );
    }
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
  searchResultDisp: {
    settingSearched: boolean;
  };
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
  searchResultDisp: {
    settingSearched: false,
  },
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
          state.searchResultDisp.settingSearched = true;
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
      .addCase(createCenter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = setSliceError(
          typeof action.payload === "string" ? action.payload : rejectedMessage,
        );
      });

    builder
      // updateCenterInfo の結果は呼び出し側（unwrap）で扱う。削除時は編集対象をクリアする
      .addCase(removeCenter.fulfilled, (state) => {
        state.target = undefined;
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

  searchResultDispSelector: () =>
    createSelector(centerRootSelector, (state) => {
      return state.searchResultDisp;
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