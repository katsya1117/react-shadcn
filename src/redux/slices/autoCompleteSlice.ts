import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";

// import Config from "../../config/apiConfig";
// import { AutoCompleteApi } from "../../api";
import type { AutoCompleteData } from "../../api";
import {
  initialSliceError,
  rejectedMessage,
  setSliceError,
  type SliceError,
} from "../common/error";
import type { AppRootState } from "../store";

// モックデータ
const users: AutoCompleteData[] = [
  { label: "sre-user", value: "sre-user", color: "#2563eb" },
  { label: "ops-admin", value: "ops-admin", color: "#10b981" },
  { label: "dev-lead", value: "dev-lead", color: "#f59e0b" },
  { label: "qa-tester", value: "qa-tester", color: "#8b5cf6" },
  { label: "data-analyst", value: "data-analyst", color: "#06b6d4" },
  { label: "security-eng", value: "security-eng", color: "#ef4444" },
  { label: "helpdesk", value: "helpdesk", color: "#22c55e" },
  { label: "pm-sato", value: "pm-sato", color: "#f97316" },
  { label: "pm-suzuki", value: "pm-suzuki", color: "#0ea5e9" },
  { label: "designer-kato", value: "designer-kato", color: "#e11d48" },
  { label: "infra-yamada", value: "infra-yamada", color: "#475569" },
  { label: "backend-kimura", value: "backend-kimura", color: "#7c3aed" },
  { label: "frontend-hayashi", value: "frontend-hayashi", color: "#14b8a6" },
  { label: "sales-tanaka", value: "sales-tanaka", color: "#facc15" },
  { label: "cs-nakamura", value: "cs-nakamura", color: "#2563eb" },
  { label: "legal-kondo", value: "legal-kondo", color: "#9ca3af" },
  { label: "auditor-mori", value: "auditor-mori", color: "#dc2626" },
];

const groups: AutoCompleteData[] = [
  { label: "東京センター", value: "tokyo", color: "#6366f1" },
  { label: "大阪DR", value: "osaka-dr", color: "#ef4444" },
  { label: "名古屋拠点", value: "nagoya", color: "#16a34a" },
  { label: "福岡センター", value: "fukuoka", color: "#0891b2" },
  { label: "札幌DC", value: "sapporo", color: "#a855f7" },
  { label: "仙台サテライト", value: "sendai", color: "#0ea5e9" },
  { label: "京都R&D", value: "kyoto", color: "#f59e0b" },
  { label: "横浜監査室", value: "yokohama-audit", color: "#dc2626" },
  { label: "神戸CS", value: "kobe-cs", color: "#10b981" },
  { label: "広島サポート", value: "hiroshima", color: "#14b8a6" },
  { label: "高崎工場", value: "takasaki", color: "#e11d48" },
  { label: "つくば研究所", value: "tsukuba", color: "#f97316" },
];

const userGroup: AutoCompleteData[] = [
  { label: "監査チーム", value: "audit", color: "#a855f7" },
  { label: "オペレーション", value: "ops", color: "#22c55e" },
];


const sliceName = "autoComplete";

// const api = new AutoCompleteApi(Config.apiConfig);

export const getAutoComplete = createAsyncThunk(
  sliceName + "/getList",
  async () => {
    // ローカルモックを即返す（API 呼び出し不要）
    await new Promise((resolve) => setTimeout(resolve, 30));
    return { users, groups };
  }
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
  // slice名
  name: sliceName,
  // 初期値
  initialState: initialState,
  // 各reducer 第一引数でstate情報を受け取り、第二引数でユーザーが操作した情報を受け取る
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
          state.error = setSliceError(
            "データの取得に失敗しました。",
            "payload"
          );
        }
        state.isLoading = false;
      })
      .addCase(getAutoComplete.rejected, (state) => {
        state.isLoading = false;
        state.error = setSliceError(rejectedMessage);
      });
  },
});

// action export
export const autoCompleteActions = autoCompleteSlice.actions;

// selector
const autoCompleteRootSelector = (state: AppRootState) => state.autoComplete;

export const autoCompleteSelector = {
  usersSelector: () =>
    createSelector(autoCompleteRootSelector, (state) => {
      return state.users;
    }),

  groupsSelector: () =>
    createSelector(autoCompleteRootSelector, (state) => {
      return state.groups;
    }),

  userGroupSelector: () =>
    createSelector(autoCompleteRootSelector, (state) => {
      return state.groups.concat(state.users);
    }),
};

// reducer export
export const autoCompleteSliceReducer = autoCompleteSlice.reducer;
export const autoCompleteReducer = autoCompleteSlice.reducer;
export default autoCompleteSlice.reducer;
