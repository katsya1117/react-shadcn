import type { UserInfo } from "../index";

type MockUserManageRow = {
  user_cd: string;
  disp_name: string;
  email: string;
  box_user_id?: string;
  center_cd: string;
};

// シンプルなモックデータ（UserManage の検索結果用）
const rawRows: MockUserManageRow[] = [
  {
    user_cd: "u001",
    disp_name: "山田 太郎",
    email: "taro@example.com",
    box_user_id: "box-taro",
    center_cd: "tokyo",
  },
  {
    user_cd: "u002",
    disp_name: "鈴木 花子",
    email: "hanako@example.com",
    box_user_id: "box-hanako",
    center_cd: "osaka",
  },
  {
    user_cd: "sre-user",
    disp_name: "SRE ユーザー",
    email: "sre@example.com",
    box_user_id: "box-sre",
    center_cd: "tokyo",
  },
  {
    user_cd: "ops-admin",
    disp_name: "Ops 管理者",
    email: "ops@example.com",
    box_user_id: "box-ops",
    center_cd: "osaka",
  },
  {
    user_cd: "dev-lead",
    disp_name: "開発リード",
    email: "devlead@example.com",
    box_user_id: "box-dev",
    center_cd: "nagoya",
  },
  {
    user_cd: "qa-tester",
    disp_name: "QA テスター",
    email: "qa@example.com",
    box_user_id: "box-qa",
    center_cd: "fukuoka",
  },
  {
    user_cd: "data-analyst",
    disp_name: "データアナリスト",
    email: "data@example.com",
    box_user_id: "box-data",
    center_cd: "sapporo",
  },
  {
    user_cd: "security-eng",
    disp_name: "セキュリティエンジニア",
    email: "sec@example.com",
    box_user_id: "box-sec",
    center_cd: "yokohama",
  },
  {
    user_cd: "helpdesk",
    disp_name: "ヘルプデスク",
    email: "help@example.com",
    box_user_id: "box-help",
    center_cd: "kobe",
  },
  {
    user_cd: "pm-sato",
    disp_name: "PM 佐藤",
    email: "pm.sato@example.com",
    box_user_id: "box-pm-sato",
    center_cd: "kyoto",
  },
  {
    user_cd: "pm-suzuki",
    disp_name: "PM 鈴木",
    email: "pm.suzuki@example.com",
    box_user_id: "box-pm-suzuki",
    center_cd: "sendai",
  },
  {
    user_cd: "designer-kato",
    disp_name: "デザイナー 加藤",
    email: "design.kato@example.com",
    box_user_id: "box-design",
    center_cd: "hiroshima",
  },
  {
    user_cd: "infra-yamada",
    disp_name: "インフラ 山田",
    email: "infra@example.com",
    box_user_id: "box-infra",
    center_cd: "tsukuba",
  },
  {
    user_cd: "backend-kimura",
    disp_name: "Backend 木村",
    email: "backend@example.com",
    box_user_id: "box-backend",
    center_cd: "takasaki",
  },
  {
    user_cd: "frontend-hayashi",
    disp_name: "Frontend 林",
    email: "frontend@example.com",
    box_user_id: "box-frontend",
    center_cd: "tokyo",
  },
];

const toUserInfo = (u: MockUserManageRow): UserInfo => ({
  user: {
    user_cd: u.user_cd,
    user_name: u.disp_name,
    user_account: u.user_cd,
    email: u.email,
    box_account: u.box_user_id,
    center: [
      {
        center_cd: u.center_cd,
        belonging_flg: 0,
      },
    ],
    language_code: 0,
    perm_cd: "standard",
  },
  user_cd: u.user_cd,
  disp_name: u.disp_name,
  email: u.email,
  box_user_id: u.box_user_id,
  center: [
    {
      center_cd: u.center_cd,
      belonging_flg: 0,
    },
  ],
});

export const userManageMock: UserInfo[] = rawRows.map(toUserInfo);
