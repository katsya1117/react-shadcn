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
  ADUserApi,
  type AccessToken,
  type PaginationResultMUser,
  type PaginationResultAdUserList,
  type UserInfo,
  type UserSearchParams,
  type UserUpdateParams,
  type AdUserSearchParams,
  type UserCreationParams,
} from "../../api";

import Config from "../../config/apiConfig";
import {
  initialSliceError,
  rejectedMessage,
  setSliceError,
  type SliceError,
} from "../common/error";

import type { AppRootState } from "../store";
import type { MultiValue } from "react-select";
import type { AutoCompleteData } from "../../api";

/**
 * UserSlice
 * ユーザー関連slice
 */

// スライス名
const sliceName = "user";

// 利用するAPI
const userApi = new UsersApi(Config.apiConfig);
const boxApi = new BoxApi(Config.apiConfig);
const adUserApi = new ADUserApi(Config.apiConfig);

/** ログインユーザー情報取得 Action */
export const getLoginUserInfo = createAsyncThunk(
  `${sliceName}/getLoginUserInfo`,
  async (userCd: string) => {
    const response = userApi.getUser(userCd, Config.apiOption);
    return (await response).data;
  },
);

/** ユーザー一覧取得 Action */
export const getUserList = createAsyncThunk(
  `${sliceName}/getUserList`,
  async (param: UserSearchParamsExt) => {
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
      Config.apiOption,
    );
    return (await response).data;
  },
);

/** ユーザー情報取得 Action */
export const getUserInfo = createAsyncThunk(
  `${sliceName}/getUserInfo`,
  async (userCd: string) => {
    const response = userApi.getUser(userCd, Config.apiOption);
    return (await response).data;
  },
);

export const updateUserInfo = createAsyncThunk(
  `${sliceName}/updateUserInfo`,
  async (param: { userCd: string; params: UserUpdateParams }) => {
    const response = userApi.updateUser(
      param.userCd,
      param.params,
      Config.apiOption,
    );
    return (await response).data;
  },
);

export const getAdUserList = createAsyncThunk(
  `${sliceName}/getAdUserList`,
  async (param: AdUserSearchParams) => {
    const response = adUserApi.getAdUserList(
      param.account_name,
      param.mail_addr,
      param.distinguished_name,
      param.organization_unit,
      param.status,
      param.sort,
      param.order,
      param.page,
      param.per_page,
      Config.apiOption,
    );
    return (await response).data;
  },
);

export const userCreation = createAsyncThunk(
  `${sliceName}/userCreation`,
  async (param: UserCreationParams) => {
    const response = userApi.createUser(param, Config.apiOption);
    return (await response).data;
  },
);

/** ユーザー削除 Action */
export const removeUser = createAsyncThunk(
  `${sliceName}/removeUser`,
  async (userCd: string) => {
    const response = userApi.removeUser(userCd, Config.apiOption);
    return (await response).data;
  },
);

/** BoxAccountId 取得 Action */
export const getBoxAccountId = createAsyncThunk(
  `${sliceName}/getBoxAccountId`,
  async (userCd: string) => {
    const response = boxApi.getBoxAccountId(userCd, Config.apiOption);
    return (await response).data;
  },
);

/** BoxAccessToken 取得 Action */
export const getBoxAccessToken = createAsyncThunk(
  `${sliceName}/getBoxAccessToken`,
  async (accountId: string) => {
    const response = boxApi.getContentsPickerToken(accountId, Config.apiOption);
    return (await response).data;
  },
);

export interface UserSearchParamsExt extends UserSearchParams {
  auto_complete?: MultiValue<AutoCompleteData>;
}

// UserState の型定義
interface UserState {
  isLogin: boolean;
  isLoading: boolean;
  error: SliceError;

  loginUserCd: string;
  loginUserInfo: UserInfo | undefined;

  list: {
    searchCondition: UserSearchParamsExt | undefined;
    data: PaginationResultMUser | undefined;
  };

  // AD連携で利用する一覧
  adList: {
    searchCondition: AdUserSearchParams | undefined;
    data: PaginationResultAdUserList | undefined;
  };

  target: UserInfo | undefined;

  box: {
    boxAccountId: string;
    token: AccessToken | undefined;
    tokenDt: number;
  };
  searchResultDisp: {
    settingSearched: boolean;
    addSearched: boolean;
  };
}

// userState の初期値
export const initialState: UserState = {
  isLogin: false,
  isLoading: false,
  error: initialSliceError,
  loginUserCd: "",
  loginUserInfo: undefined,
  list: {
    searchCondition: undefined,
    data: undefined,
  },
  adList: {
    searchCondition: undefined,
    data: undefined,
  },
  target: undefined,
  box: {
    boxAccountId: "",
    token: undefined,
    tokenDt: -1,
  },
  searchResultDisp: {
    settingSearched: false,
    addSearched: false,
  },
};

// slice定義
const userSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.isLogin = true;
      state.loginUserCd = action.payload;
    },
    resetCondition: (state) => {
      state.list.searchCondition = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLoginUserInfo.pending, (state, action) => {
        state.loginUserCd = action.meta.arg;
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getLoginUserInfo.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.loginUserInfo = action.payload;
          state.isLogin = true;

          // APIのカスタムヘッダを更新する
          Config.apiOption.headers = {
            "x-jcl-user": String(
              action.payload.user?.user_cd ?? "unknown user",
            ),
          };
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(getLoginUserInfo.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });

    builder
      // getUserList
      .addCase(getUserList.pending, (state, action) => {
        state.isLoading = true;
        state.error = initialSliceError;
        state.list.searchCondition = {
          ...action.meta.arg,
          auto_complete: action.meta.arg.auto_complete
            ? [...action.meta.arg.auto_complete]
            : undefined,
        };
      })
      .addCase(getUserList.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.list.data = action.payload;
          state.searchResultDisp.settingSearched = true;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(getUserList.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
    builder
      .addCase(getUserInfo.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.target = action.payload;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(getUserInfo.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
    builder
      .addCase(updateUserInfo.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(updateUserInfo.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.error = initialSliceError;
        } else {
          state.error = setSliceError(
            "データの更新に失敗しました。",
            "invalid response",
          );
        }
        state.isLoading = false;
      })
      .addCase(updateUserInfo.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });

    builder
      // removeUser
      .addCase(removeUser.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.error = initialSliceError;
        } else {
          state.error = setSliceError(
            "削除に失敗しました",
            "Failed to delete user",
          );
        }
        state.isLoading = false;
      })
      .addCase(removeUser.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
    builder
      .addCase(getAdUserList.pending, (state, action) => {
        state.isLoading = true;
        state.error = initialSliceError;
        state.adList.searchCondition = action.meta.arg;
      })
      .addCase(getAdUserList.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.adList.data = action.payload;
          state.searchResultDisp.addSearched = true;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(getAdUserList.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
    builder
      // userCreation
      .addCase(userCreation.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(userCreation.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.error = initialSliceError;
        } else {
          state.error = setSliceError(
            "ユーザーの作成に失敗しました。",
            "invalid response",
          );
        }
        state.isLoading = false;
      })
      .addCase(userCreation.rejected, (state) => {
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
      return state.loginUserInfo;
    }),

  loginUserCdSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.loginUserCd;
    }),

  isLoadingSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.isLoading;
    }),

  isLoginSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.isLogin;
    }),

  userSearchConditionSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.list.searchCondition;
    }),

  userListSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.list.data;
    }),
  userTargetSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.adList.data;
    }),
  // AD連携の一覧
  adUserListSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.adList.data;
    }),

  adUserSearchConditionSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.adList.searchCondition;
    }),

  // UserManage が参照する互換用セレクタ（モックでは常に undefined）
  searchResultDispSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.searchResultDisp;
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

export const userSliceReducer = userSlice.reducer;
