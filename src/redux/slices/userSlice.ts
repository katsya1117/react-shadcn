// src/redux/slices/userSlice.ts

import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import {
  BoxApi,
  UsersApi,
  type AccessToken,
  type PaginationResultMUser,
  type UserInfo,
  type UserUpdateParams,
  type UserSearchParams,
} from "../../api";

import Config from "../../config/apiConfig";
import {
  initialSliceError,
  rejectedMessage,
  setSliceError,
  type SliceError,
} from "../common/error";

import type { AppRootState } from "../store";

/**
 * UserSlice
 * ユーザー関連slice
 */

// スライス名
const sliceName = "user";

// 利用するAPI
const userApi = new UsersApi(Config.apiConfig);
const boxApi = new BoxApi(Config.apiConfig);

/** ユーザー情報取得 Action */
export const getUserInfo = createAsyncThunk(
  `${sliceName}/getUserInfo`,
  async (userCd: string) => {
    const response = userApi.getUser(userCd, Config.apiOption);
    return (await response).data;
  }
);

/** ユーザー一覧取得 Action */
export const getUserList = createAsyncThunk(
  `${sliceName}/getUserList`,
  async (param: UserSearchParams) => {
    const response = userApi.getUserList(
      param.user_name,
      param.user_account,
      param.user_email,
      param.center_cd_list,
      param.delete_flag,
      param.sort,
      param.order,
      param.page,
      param.per_page,
      Config.apiOption
    );
    return (await response).data;
  }
);

/** ユーザー情報更新 Action */
export const updateUserInfo = createAsyncThunk(
  `${sliceName}/updateUserInfo`,
  async (param: UserUpdateParams) => {
    const response = userApi.updateUser(
      param.user_cd,
      {
        user_name: param.user_name,
        email: param.email,
        center: param.center,
        box_account: param.box_account,
      },
      Config.apiOption
    );
    return (await response).data;
  }
);

/** BoxAccountId 取得 Action */
export const getBoxAccountId = createAsyncThunk(
  `${sliceName}/getBoxAccountId`,
  async (userCd: string) => {
    const response = boxApi.getBoxAccountId(userCd, Config.apiOption);
    return (await response).data;
  }
);

/** BoxAccessToken 取得 Action */
export const getBoxAccessToken = createAsyncThunk(
  `${sliceName}/getBoxAccessToken`,
  async (accountId: string) => {
    const response = boxApi.getContentsPickerToken(accountId, Config.apiOption);
    return (await response).data;
  }
);

// UserState の型定義
interface UserState {
  isLogin: boolean;
  isLoading: boolean;
  error: SliceError;

  userCd: string;
  userInfo: UserInfo | undefined;

  list: {
    searchCondition: UserSearchParams | undefined;
    data: PaginationResultMUser | undefined;
  };

  box: {
    boxAccountId: string;
    token: AccessToken | undefined;
    tokenDt: number;
  };
}

// userState の初期値
const initialState: UserState = {
  isLogin: false,
  isLoading: false,
  error: initialSliceError,

  userCd: "",
  userInfo: undefined,

  list: {
    searchCondition: undefined,
    data: undefined,
  },

  box: {
    boxAccountId: "",
    token: undefined,
    tokenDt: -1,
  },
};

// slice定義
const userSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.isLogin = true;
      state.userCd = action.payload;
    },
    resetCondition: (state) => {
      state.list.searchCondition = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // getUserInfo
      .addCase(getUserInfo.pending, (state, action) => {
        state.userCd = action.meta.arg;
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.userInfo = action.payload;
          state.isLogin = true;

          // APIのカスタムヘッダを更新する
          Config.apiOption.headers = {
            "x-jcl-user": action.payload.user?.user_cd ?? "unknown user",
          };
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload"
          );
        }
        state.isLoading = false;
      })
      .addCase(getUserInfo.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      })

      // getUserList
      .addCase(getUserList.pending, (state, action) => {
        state.isLoading = true;
        state.error = initialSliceError;
        state.list.searchCondition = action.meta.arg;
      })
      .addCase(getUserList.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.list.data = action.payload;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload"
          );
        }
        state.isLoading = false;
      })
      .addCase(getUserList.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });

    builder
      // updateUserInfo
      .addCase(updateUserInfo.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(updateUserInfo.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.userInfo = action.payload;
          if (state.list.data?.data) {
            state.list.data.data = state.list.data.data.map((row) =>
              row.user?.user_cd === action.payload.user?.user_cd
                ? action.payload
                : row
            );
          }
        } else {
          state.error = setSliceError("更新対象のユーザーが見つかりません。");
        }
        state.isLoading = false;
      })
      .addCase(updateUserInfo.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });

    builder
      // getBoxAccountId
      .addCase(getBoxAccountId.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getBoxAccountId.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.box.boxAccountId = action.payload;
        } else {
          state.error = setSliceError("Boxアカウントが不明です");
        }
        state.isLoading = false;
      })
      .addCase(getBoxAccountId.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });

    builder
      // getBoxAccessToken
      .addCase(getBoxAccessToken.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getBoxAccessToken.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.box.token = action.payload;
          state.box.tokenDt = Date.now();
        } else {
          state.error = setSliceError("Box接続トークン発行に失敗しました。");
        }
        state.isLoading = false;
      })
      .addCase(getBoxAccessToken.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
  },
});

// action export
export const userActions = userSlice.actions;

// selector
const userRootSelector = (state: AppRootState) => state.user;

export const userSelector = {
  loginUserSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.userInfo;
    }),

  userCdSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.userCd;
    }),

  isLoadingSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.isLoading;
    }),

  isLoginSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.isLogin;
    }),

  searchConditionSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.list.searchCondition;
    }),

  userListSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.list.data;
    }),
};

export const boxSelector = {
  accountIdSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.box.boxAccountId;
    }),

  tokenSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.box.token;
    }),

  tokenDtSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.box.tokenDt;
    }),
};

// reducerをexport
// exportしたreducerはstoreで登録します
export const userSliceReducer = userSlice.reducer;
