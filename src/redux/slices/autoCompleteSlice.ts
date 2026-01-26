import type { AnyAction } from "redux";
import type { AutoCompleteData } from "@/api";

// モックデータ
const users: AutoCompleteData[] = [
  { label: "sre-user", value: "sre-user", color: "#2563eb" },
  { label: "ops-admin", value: "ops-admin", color: "#10b981" },
  { label: "dev-lead", value: "dev-lead", color: "#f59e0b" },
];

const groups: AutoCompleteData[] = [
  { label: "東京センター", value: "tokyo", color: "#6366f1" },
  { label: "大阪DR", value: "osaka-dr", color: "#ef4444" },
];

const userGroup: AutoCompleteData[] = [
  { label: "監査チーム", value: "audit", color: "#a855f7" },
  { label: "オペレーション", value: "ops", color: "#22c55e" },
];

// セレクター（クローズオーバーで安定参照を返す）
const selectUsers = () => users;
const selectGroups = () => groups;
const selectUserGroup = () => userGroup;

export const autoCompleteSelector = {
  usersSelector: () => selectUsers,
  groupsSelector: () => selectGroups,
  userGroupSelector: () => selectUserGroup,
};

// thunk 風ダミーアクション
export const getAutoComplete = () => {
  return { type: "autocomplete/fetch" } as AnyAction;
};

// reducer は未実装（モック）
export const autoCompleteReducer = (state = { users, groups, userGroup }, action: AnyAction) =>
  state;
