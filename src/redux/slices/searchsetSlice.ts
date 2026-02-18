// src/redux/slices/userSlice.ts

import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import { searchsetApi, type SearchsetParamType } from "../../api";

import Config from "../../config/apiConfig";
import {
  initialSliceError,
  rejectedMessage,
  setSliceError,
  type SliceError,
} from "../common/error";

import type { AppRootState } from "../store";

/**
 * searchSetSlice
 * ユーザー関連slice
 */

// スライス名
const sliceName = "searchSet";

// 利用するAPI
const searchsetApi = new searchsetApi(Config.apiConfig);

/** ユーザーの全ての検索セット取得 Action */
export const getAllSearchsets = createAsyncThunk(
  `${sliceName}/getAllSearchsets`,
  async (userCd: string) => {
    const response = searchsetApi.getAllSearchsets(
      method,
      userCd,
      Config.apiOption,
    );
    return (await response).data;
  },
);

/** ユーザーのmyPage全ての検索セット取得 Action */
export const getMySearchsets = createAsyncThunk(
  `${sliceName}/getMySearchsets`,
  async (userCd: string) => {
    const response = searchsetApi.getAllSearchsets(
      method,
      userCd,
      Config.apiOption,
    );
    return (await response).data.map((item) => item.search_cd);
  },
);

export interface Searchset {
  search_cd: string;
  name: string;
}

// SearchsetState の型定義
interface SearchsetState {
  isLoading: boolean;
  error: SliceError;
  entities: Searchset[];
  mySearchsetIds: string[];
}

// SearchsetState の初期値
const initialState: SearchsetState = {
  isLoading: false,
  error: initialSliceError,
  entities: [],
  mySearchsetIds: [],
};

// slice定義
const searchsetSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    clearSearchset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // getAllSearchsets
      .addCase(getAllSearchsets.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getAllSearchsets.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.entities = action.payload;
          state.isLoading = false;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(getAllSearchsets.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      })

      // getMySearchsets
      .addCase(getMySearchsets.pending, (state) => {
        state.isLoading = true;
        state.error = initialSliceError;
      })
      .addCase(getMySearchsets.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.mySearchsetIds = action.payload;
        } else {
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "not found payload",
          );
        }
        state.isLoading = false;
      })
      .addCase(getMySearchsets.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
  },
});

// action export
export const searchsetActions = searchsetSlice.actions;

// selector
const searchsetRootSelector = (state: AppRootState) => state.searchset;

export const userSelector = {
  mySearchsetSelector: () =>
    createSelector(searchsetSelector, (state) => {
      const { entities, mySearchsetIds } = state;
      return entries.filter(item=>mySearchsetIds.includes(item.search_cd));
  }),

  notMySearchsetSelector: () =>
    createSelector(searchsetSelector, (state) => {
      const { entities, mySearchsetIds } = state;
      return entries.filter(item=>!mySearchsetIds.includes(item.search_cd));
  }),
};

// reducerをexport
// exportしたreducerはstoreで登録します
export const searchsetSliceReducer = searchsetSlice.reducer;

// export const selectSearchPageItems = (state: RootState) => {
//   // AとBを結合して表示
//   return [...state.searchset.patternA, ...state.searchset.patternB];
// };

// マイページ切り替え
// const MypageConfigPage = ({ targetUserCd }: { targetUserCd: string }) => {
//   const { patternA, patternB } = useSelector((state: RootState) => state.searchset);
//   const dispatch = useDispatch();

//   // AからBへ移動させる（＝マイページから外す）操作
//   const handleMoveToB = async (search_cd: string) => {
//     // 1. Aから外すためのAPIを叩く（仕様に合わせて実装）
//     // 2. 完了後、Reduxを更新して「今の正しい状態」にする
//     dispatch(refreshSearchsets(targetUserCd));
//   };

//   return (
//     <div>
//       <h2>マイページ表示中 (パターンA)</h2>
//       {patternA.map(item => (
//         <div key={item.search_cd}>{item.name} <button onClick={() => handleMoveToB(item.search_cd)}>外す</button></div>
//       ))}

//       <h2>それ以外 (パターンB)</h2>
//       {patternB.map(item => (
//         <div key={item.search_cd}>{item.name} <button>マイページに追加</button></div>
//       ))}
//     </div>
//   );
// };