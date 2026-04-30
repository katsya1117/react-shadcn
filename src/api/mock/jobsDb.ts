export type JobStatus = "実行中" | "待機" | "完了" | "失敗";
export type AccessLevel = "編集可" | "閲覧のみ" | "ブロック";

export type MockJob = {
  id: string;
  title: string;
  status: JobStatus;
  owner: string;
  folder: string;
  updatedAt: string;
  nextRun: string;
  priority: "高" | "中" | "低";
};

export type MockFolder = {
  name: string;
  path: string;
  access: AccessLevel;
  watchers: string[];
  description?: string;
  updatedAt: string;
};

export const mockJobs: MockJob[] = [
  {
    id: "JOB-1001",
    title: "月次請求バッチ",
    status: "実行中",
    owner: "経理",
    folder: "/billing/monthly",
    updatedAt: "2026-01-20T10:30:00Z",
    nextRun: "2026-01-25T02:00:00Z",
    priority: "高",
  },
  {
    id: "JOB-1002",
    title: "人事マスタ同期",
    status: "待機",
    owner: "人事",
    folder: "/master/hr",
    updatedAt: "2026-01-22T04:30:00Z",
    nextRun: "2026-01-23T23:00:00Z",
    priority: "中",
  },
  {
    id: "JOB-1003",
    title: "ログ圧縮",
    status: "失敗",
    owner: "SRE",
    folder: "/logs/daily",
    updatedAt: "2026-01-21T06:00:00Z",
    nextRun: "2026-01-22T06:00:00Z",
    priority: "中",
  },
];

export const mockFolders: MockFolder[] = [
  {
    name: "Billing 月次",
    path: "/billing/monthly",
    access: "編集可",
    watchers: ["経理", "FinOps"],
    description: "請求関連のジョブと出力が入る月次バッチ領域",
    updatedAt: "2026-01-20T10:00:00Z",
  },
  {
    name: "人事マスタ",
    path: "/master/hr",
    access: "閲覧のみ",
    watchers: ["人事", "情報システム"],
    description: "従業員情報のソース",
    updatedAt: "2026-01-22T03:00:00Z",
  },
  {
    name: "ログ日次",
    path: "/logs/daily",
    access: "閲覧のみ",
    watchers: ["SRE"],
    updatedAt: "2026-01-21T08:00:00Z",
  },
];
