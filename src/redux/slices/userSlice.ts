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
  type AdUserList,
  type Pagination,
  type PaginationResultMUser,
  type UserCreationParams,
  type UserInfo,
  type UserSearchParams,
  type UserUpdateParams,
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
  },
);

/** ユーザー一覧取得 Action */
export const getUserList = createAsyncThunk(
  `${sliceName}/getUserList`,
  async (param: UserSearchParams) => {
    const response = userApi.getUserList(param);
    return (await response).data;
  },
);

// AD ユーザー一覧取得 Action（モック）
const adUsersMock: AdUserList[] = Array.from({ length: 24 }).map((_, i) => {
  const id = i + 1;
  const registered = id % 4 === 0;
  return {
    mail_addr: `user${id.toString().padStart(3, "0")}@example.com`,
    account_name: `user${id.toString().padStart(3, "0")}`,
    disp_name: `利用者 ${id.toString().padStart(3, "0")}`,
    organization_unit: id % 2 === 0 ? "営業部" : "開発部",
    distinguished_name: `cn=user${id},dc=example,dc=com`,
    status1: registered ? "1" : "0",
    status2: registered ? "1" : "0",
  };
});

export const getAdUserList = createAsyncThunk(
  `${sliceName}/getAdUserList`,
  async (param: UserSearchParams) => {
    const {
      disp_name,
      account_name,
      mail_addr,
      status = "",
      page = 1,
      per_page = 10,
    } = param;

    let rows = adUsersMock;
    if (disp_name) {
      const q = disp_name.toLowerCase();
      rows = rows.filter((u) => u.disp_name.toLowerCase().includes(q));
    }
    if (account_name) {
      const q = account_name.toLowerCase();
      rows = rows.filter((u) => u.account_name.toLowerCase().includes(q));
    }
    if (mail_addr) {
      const q = mail_addr.toLowerCase();
      rows = rows.filter((u) => u.mail_addr.toLowerCase().includes(q));
    }
    if (status !== "") {
      rows = rows.filter((u) =>
        status === "1" ? u.status1 === "1" : u.status1 !== "1",
      );
    }

    const total = rows.length;
    const start = (page - 1) * per_page;
    const items = rows.slice(start, start + per_page);
    const last_page = Math.max(1, Math.ceil(total / per_page));
    const pagination: Pagination = {
      current_page: page,
      last_page,
      per_page,
      from: total === 0 ? 0 : start + 1,
      to: Math.min(total, start + per_page),
      total,
      first_page_url: `/api/ad_users?page=1&per_page=${per_page}`,
      prev_page_url:
        page > 1 ? `/api/ad_users?page=${page - 1}&per_page=${per_page}` : null,
      next_page_url:
        start + per_page < total
          ? `/api/ad_users?page=${page + 1}&per_page=${per_page}`
          : null,
      last_page_url: `/api/ad_users?page=${last_page}&per_page=${per_page}`,
    };

    return { items, pagination };
  },
);

/** AD ユーザー登録 Action（モック） */
export const userCreation = createAsyncThunk(
  `${sliceName}/userCreation`,
  async (param: UserCreationParams) => {
    // 実際の API では param を送信する想定。ここではモックで即時成功を返却
    return { ok: true, user: param };
  },
);

/** ユーザー情報更新 Action */
type UpdateUserArgs = { userCd: string; params: UserUpdateParams };

export const updateUserInfo = createAsyncThunk(
  `${sliceName}/updateUserInfo`,
  async ({ userCd, params }: UpdateUserArgs) => {
    const response = userApi.updateUser(userCd, params, Config.apiOption);
    return (await response).data;
  },
);

/** ユーザー削除 Action */
export const removeUser = createAsyncThunk(
  `${sliceName}/removeUser`,
  async (userCd: string) => {
    const response = userApi.removeUser(userCd, Config.apiOption);
    return (await response).data as boolean;
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

  // AD連携で利用する一覧
  ad: {
    searchCondition: UserSearchParams | undefined;
    data:
      | {
          items: AdUserList[];
          pagination: Pagination;
        }
      | undefined;
    addSearched: boolean;
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

  ad: {
    searchCondition: undefined,
    data: undefined,
    addSearched: false,
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
      .addCase(getUserInfo.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      })

      // getUserList
      .addCase(getUserList.pending, (state, action) => {
        state.isLoading = true;
        state.error = initialSliceError;
        const autoComplete = action.meta.arg.auto_complete
          ? [...action.meta.arg.auto_complete]
          : undefined;
        state.list.searchCondition = {
          ...action.meta.arg,
          auto_complete: autoComplete,
        };
      })
      .addCase(getUserList.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.list.data = action.payload;
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
      })
      // getAdUserList
      .addCase(getAdUserList.pending, (state, action) => {
        state.isLoading = true;
        state.error = initialSliceError;
        const autoComplete = action.meta.arg.auto_complete
          ? [...action.meta.arg.auto_complete]
          : undefined;
        state.ad.searchCondition = {
          ...action.meta.arg,
          auto_complete: autoComplete,
        };
        state.ad.addSearched = false;
      })
      .addCase(getAdUserList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ad.data = action.payload;
        state.ad.addSearched = true;
      })
      .addCase(getAdUserList.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
        state.ad.addSearched = true;
      })

      // userCreation
      .addCase(userCreation.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(userCreation.fulfilled, (state, action) => {
        state.isLoading = false;
        const email = action.meta.arg.email;
        if (state.ad.data) {
          state.ad.data.items = state.ad.data.items.map((u) =>
            u.mail_addr === email ? { ...u, status1: "1" } : u,
          );
        }
      })
      .addCase(userCreation.rejected, (state) => {
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
        } else {
          state.error = setSliceError("更新対象のユーザーが見つかりません。");
        }
        state.isLoading = false;
      })
      .addCase(updateUserInfo.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      })

      // removeUser
      .addCase(removeUser.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (!action.payload) {
          state.error = setSliceError("削除に失敗しました", "payload");
        }
      })
      .addCase(removeUser.rejected, (state) => {
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
const emptyPagination: Pagination = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  from: 0,
  to: 0,
  total: 0,
  first_page_url: "",
  prev_page_url: null,
  next_page_url: null,
  last_page_url: "",
};

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

  // AD連携の一覧
  asUserListSelector: () =>
    createSelector(userRootSelector, (state) => {
      return (
        state.ad.data ?? {
          items: [],
          pagination: emptyPagination,
        }
      );
    }),

  adUserSearchConditionSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.ad.searchCondition ?? {};
    }),

  // UserEdit などでターゲットユーザーを参照するためのセレクタ
  userTargetSelector: () =>
    createSelector(userRootSelector, (state) => {
      return state.userInfo;
    }),

  // UserManage が参照する互換用セレクタ（モックでは常に undefined）
  searchResultDispSelector: () =>
    createSelector(userRootSelector, (state) => {
      return {
        settingSearched: state.list.searchCondition !== undefined,
        addSearched: state.ad.addSearched,
      };
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
