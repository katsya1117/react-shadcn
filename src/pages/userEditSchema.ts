import { z } from "zod";
import type { DefaultSelection36PermissionPayload } from "@/api";

export type PermBase = Omit<
  DefaultSelection36PermissionPayload,
  | "perm_cd"
  | "perm_name"
  | "id"
  | "can_group_adduser"
  | "can_status_force_close"
  | "can_status_openclose"
  | "search_cd1"
  | "search_cd2"
  | "search_cd3"
>;

export type PermCd = keyof PermBase;

export type PermLabel =
  | "ジョブ作成"
  | "ステータスインポート"
  | "アクセスユーザー設定"
  | "ステータス編集"
  | "保管期限変更"
  | "JOB属性編集"
  | "再版"
  | "ユーザー特定設定"
  | "ログ検索"
  | "管理メニュー"
  | "NGワード"
  | "自動削除フォルダー設定"
  | "MyPageデフォルト検索条件1"
  | "MyPageデフォルト検索条件2"
  | "MyPageデフォルト検索条件3";

export type PermLabelMap = {
  [key in PermCd]: PermLabel;
};

export const permLabelMap: PermLabelMap = {
  can_job_create: "ジョブ作成",
  can_status_import: "ステータスインポート",
  can_access_authority: "アクセスユーザー設定",
  can_status_change: "ステータス編集",
  can_job_change_expiry: "保管期限変更",
  can_job_change: "JOB属性編集",
  can_status_reissue: "再版",
  can_job_arrow_user: "ユーザー特定設定",
  can_log_search: "ログ検索",
  can_manage: "管理メニュー",
  can_ng_word: "NGワード",
  can_auto_delete: "自動削除フォルダー設定",
};

export interface Permission {
  key: PermCd;
  label: PermLabel;
  value: number;
}

export interface SearchCondition {
  key: string;
  label:
    | "MyPageデフォルト検索条件1"
    | "MyPageデフォルト検索条件2"
    | "MyPageデフォルト検索条件3";
  search_cd: SearchConditionCd;
  value: SearchConditionVal;
}

export interface DispPerm {
  perm_cd: string;
  perm_name: string;
  permissions: Permission[];
  search_conditions: SearchCondition[];
}

export type SearchConditionCd = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SearchConditionVal =
  | "6ヶ月経過JOB"
  | "長期放置JOB"
  | "作業終了後3ヶ月経過JOB"
  | "作業終了JOB"
  | "当月保管期限JOB"
  | "M-D保管期限JOB"
  | "削除フラグJOB";

export type SearchConditionValMapType = {
  [key in SearchConditionCd]: SearchConditionVal;
};

export const SearchConditionValMap: SearchConditionValMapType = {
  1: "6ヶ月経過JOB",
  2: "長期放置JOB",
  3: "作業終了後3ヶ月経過JOB",
  4: "作業終了JOB",
  5: "当月保管期限JOB",
  6: "M-D保管期限JOB",
  7: "削除フラグJOB",
};

export const MAX_DISP_LEN = 100;
export const MAX_ACCOUNT_LEN = 100;
export const MAX_EMAIL_LEN = 200;

const asciiNoSpaceRegex = /^[\x21-\x7E]*$/;
const hasAsciiAlphaNum = /[A-Za-z0-9]/;
const hasLetterOrNumber = /[\p{L}\p{N}]/u;
const emailSchema = z.string().email();

export const deriveUserId = (accountName: string) =>
  accountName.replace(/^Y[\\¥]/, "");

export const userIdSchema = z
  .string()
  .trim()
  .min(1, "ユーザーIDは必須です")
  .refine(
    (value) => asciiNoSpaceRegex.test(value),
    "ユーザーIDは1バイト文字のみ入力できます",
  )
  .refine(
    (value) => hasAsciiAlphaNum.test(value),
    "ユーザーIDは記号だけは不可です",
  );

export const userUpdateSchema = z.object({
  dispName: z
    .string()
    .trim()
    .min(1, "表示名は必須です")
    .max(MAX_DISP_LEN, "表示名の文字数制限を超えています")
    .refine(
      (value) => hasLetterOrNumber.test(value),
      "表示名は記号だけは不可です",
    ),
  account: z
    .string()
    .trim()
    .min(1, "ユーザー名は必須です")
    .max(MAX_ACCOUNT_LEN, "ユーザー名の文字数制限を超えています")
    .refine(
      (value) => asciiNoSpaceRegex.test(value),
      "ユーザー名は1バイト文字のみ入力できます",
    )
    .refine(
      (value) => hasAsciiAlphaNum.test(value),
      "ユーザー名は記号だけは不可です",
    ),
  mail: z
    .string()
    .trim()
    .min(1, "メールアドレスは必須です")
    .max(MAX_EMAIL_LEN, "メールアドレスの文字数制限を超えています")
    .refine(
      (value) => asciiNoSpaceRegex.test(value),
      "メールアドレスは1バイト文字のみ入力できます",
    )
    .refine(
      (value) => hasAsciiAlphaNum.test(value),
      "メールアドレスは記号だけは不可です",
    )
    .refine(
      (value) => emailSchema.safeParse(value).success,
      "メールアドレスの形式が不正です",
    ),
});
