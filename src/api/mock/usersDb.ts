import type { PaginationResultMUser, UserInfo } from "../index";

type MockUser = {
  user_cd: string;
  user_name: string;
  user_account?: string;
  email: string;
  box_account?: string;
  center_cd?: string; // 追加: "tokyo" 等のコード値
  center?: string; // 既存: "東京センター" 等の表示名
  language_code?: number;
  perm_cd?: string;
};

// シンプルなインメモリDB（セッション中のみ保持）
const db: MockUser[] = [
  {
    user_cd: "u001",
    user_name: "山田 太郎",
    email: "taro@example.com",
    box_account: "box-taro",
    center_cd: "tokyo",
    center: "東京センター",
  },
  {
    user_cd: "u002",
    user_name: "鈴木 花子",
    email: "hanako@example.com",
    box_account: "box-hanako",
    center_cd: "osaka",
    center: "大阪DR",
  },
  {
    user_cd: "sre-user",
    user_name: "SRE ユーザー",
    email: "sre@example.com",
    box_account: "box-sre",
    center_cd: "tokyo",
    center: "東京センター",
  },
  {
    user_cd: "ops-admin",
    user_name: "Ops 管理者",
    email: "ops@example.com",
    box_account: "box-ops",
    center_cd: "osaka",
    center: "大阪DR",
  },
  {
    user_cd: "dev-lead",
    user_name: "開発リード",
    email: "devlead@example.com",
    box_account: "box-dev",
    center_cd: "nagoya",
    center: "名古屋拠点",
  },
  {
    user_cd: "qa-tester",
    user_name: "QA テスター",
    email: "qa@example.com",
    box_account: "box-qa",
    center_cd: "fukuoka",
    center: "福岡センター",
  },
  {
    user_cd: "data-analyst",
    user_name: "データアナリスト",
    email: "data@example.com",
    box_account: "box-data",
    center_cd: "sapporo",
    center: "札幌DC",
  },
  {
    user_cd: "security-eng",
    user_name: "セキュリティエンジニア",
    email: "sec@example.com",
    box_account: "box-sec",
    center_cd: "yokohama",
    center: "横浜監査室",
  },
  {
    user_cd: "helpdesk",
    user_name: "ヘルプデスク",
    email: "help@example.com",
    box_account: "box-help",
    center_cd: "kobe",
    center: "神戸CS",
  },
  {
    user_cd: "pm-sato",
    user_name: "PM 佐藤",
    email: "pm.sato@example.com",
    box_account: "box-pm-sato",
    center_cd: "kyoto",
    center: "京都R&D",
  },
  {
    user_cd: "pm-suzuki",
    user_name: "PM 鈴木",
    email: "pm.suzuki@example.com",
    box_account: "box-pm-suzuki",
    center_cd: "sendai",
    center: "仙台サテライト",
  },
  {
    user_cd: "designer-kato",
    user_name: "デザイナー 加藤",
    email: "design.kato@example.com",
    box_account: "box-design",
    center_cd: "hiroshima",
    center: "広島サポート",
  },
  {
    user_cd: "infra-yamada",
    user_name: "インフラ 山田",
    email: "infra@example.com",
    box_account: "box-infra",
    center_cd: "tsukuba",
    center: "つくば研究所",
  },
  {
    user_cd: "backend-kimura",
    user_name: "Backend 木村",
    email: "backend@example.com",
    box_account: "box-backend",
    center_cd: "takasaki",
    center: "高崎工場",
  },
  {
    user_cd: "frontend-hayashi",
    user_name: "Frontend 林",
    email: "frontend@example.com",
    box_account: "box-frontend",
    center_cd: "tokyo",
    center: "東京センター",
  },
  {
    user_cd: "sales-tanaka",
    user_name: "営業 田中",
    email: "sales@example.com",
    box_account: "box-sales",
    center_cd: "osaka",
    center: "大阪DR",
  },
  {
    user_cd: "cs-nakamura",
    user_name: "CS 中村",
    email: "cs@example.com",
    box_account: "box-cs",
    center_cd: "fukuoka",
    center: "福岡センター",
  },
  {
    user_cd: "legal-kondo",
    user_name: "法務 近藤",
    email: "legal@example.com",
    box_account: "box-legal",
    center_cd: "nagoya",
    center: "名古屋拠点",
  },
  {
    user_cd: "auditor-mori",
    user_name: "監査 森",
    email: "audit.mori@example.com",
    box_account: "box-audit",
    center_cd: "yokohama",
    center: "横浜監査室",
  },
  {
    user_cd: "hr-yoshida",
    user_name: "人事 吉田",
    email: "hr.yoshida@example.com",
    box_account: "box-hr",
    center_cd: "tokyo",
    center: "東京センター",
  },
  {
    user_cd: "finance-inoue",
    user_name: "経理 井上",
    email: "finance@example.com",
    box_account: "box-finance",
    center_cd: "osaka",
    center: "大阪DR",
  },
  {
    user_cd: "it-watanabe",
    user_name: "IT 渡辺",
    email: "it@example.com",
    box_account: "box-it",
    center_cd: "tokyo",
    center: "東京センター",
  },
  {
    user_cd: "support-ito",
    user_name: "サポート 伊藤",
    email: "support@example.com",
    box_account: "box-support",
    center_cd: "nagoya",
    center: "名古屋拠点",
  },
  {
    user_cd: "ml-engineer",
    user_name: "ML エンジニア",
    email: "ml@example.com",
    box_account: "box-ml",
    center_cd: "tsukuba",
    center: "つくば研究所",
  },
  {
    user_cd: "network-fujita",
    user_name: "ネットワーク 藤田",
    email: "network@example.com",
    box_account: "box-network",
    center_cd: "yokohama",
    center: "横浜監査室",
  },
  {
    user_cd: "db-ogawa",
    user_name: "DB 小川",
    email: "db@example.com",
    box_account: "box-db",
    center_cd: "sendai",
    center: "仙台サテライト",
  },
  {
    user_cd: "cloud-matsuda",
    user_name: "クラウド 松田",
    email: "cloud@example.com",
    box_account: "box-cloud",
    center_cd: "sapporo",
    center: "札幌DC",
  },
  {
    user_cd: "mobile-shimizu",
    user_name: "モバイル 清水",
    email: "mobile@example.com",
    box_account: "box-mobile",
    center_cd: "fukuoka",
    center: "福岡センター",
  },
  {
    user_cd: "test-hayashi",
    user_name: "テスト 林",
    email: "test@example.com",
    box_account: "box-test",
    center_cd: "kyoto",
    center: "京都R&D",
  },
  {
    user_cd: "scrum-ikeda",
    user_name: "スクラムマスター 池田",
    email: "scrum@example.com",
    box_account: "box-scrum",
    center_cd: "tokyo",
    center: "東京センター",
  },
  {
    user_cd: "arch-nishimura",
    user_name: "アーキテクト 西村",
    email: "arch@example.com",
    box_account: "box-arch",
    center_cd: "osaka",
    center: "大阪DR",
  },
  {
    user_cd: "biz-kobayashi",
    user_name: "企画 小林",
    email: "biz@example.com",
    box_account: "box-biz",
    center_cd: "nagoya",
    center: "名古屋拠点",
  },
  {
    user_cd: "ux-abe",
    user_name: "UX 阿部",
    email: "ux@example.com",
    box_account: "box-ux",
    center_cd: "hiroshima",
    center: "広島サポート",
  },
  {
    user_cd: "devops-maeda",
    user_name: "DevOps 前田",
    email: "devops@example.com",
    box_account: "box-devops",
    center_cd: "takasaki",
    center: "高崎工場",
  },
  {
    user_cd: "analyst-okamoto",
    user_name: "アナリスト 岡本",
    email: "analyst@example.com",
    box_account: "box-analyst",
    center_cd: "kobe",
    center: "神戸CS",
  },
  {
    user_cd: "pm-tanaka",
    user_name: "PM 田中",
    email: "pm.tanaka@example.com",
    box_account: "box-pm-tanaka",
    center_cd: "sendai",
    center: "仙台サテライト",
  },
  {
    user_cd: "lead-saito",
    user_name: "リード 斉藤",
    email: "lead@example.com",
    box_account: "box-lead",
    center_cd: "tokyo",
    center: "東京センター",
  },
  {
    user_cd: "ops-ueda",
    user_name: "運用 上田",
    email: "ops.ueda@example.com",
    box_account: "box-ops-ueda",
    center_cd: "osaka",
    center: "大阪DR",
  },
  {
    user_cd: "sec-goto",
    user_name: "セキュリティ 後藤",
    email: "sec.goto@example.com",
    box_account: "box-sec-goto",
    center_cd: "yokohama",
    center: "横浜監査室",
  },
  {
    user_cd: "data-ishii",
    user_name: "データ基盤 石井",
    email: "data.ishii@example.com",
    box_account: "box-data-ishii",
    center_cd: "tsukuba",
    center: "つくば研究所",
  },
  {
    user_cd: "qa-fujii",
    user_name: "QA 藤井",
    email: "qa.fujii@example.com",
    box_account: "box-qa-fujii",
    center_cd: "fukuoka",
    center: "福岡センター",
  },
  {
    user_cd: "infra-hayashi",
    user_name: "インフラ 林",
    email: "infra.hayashi@example.com",
    box_account: "box-infra-hayashi",
    center_cd: "sapporo",
    center: "札幌DC",
  },
  {
    user_cd: "design-mori",
    user_name: "デザイン 森",
    email: "design.mori@example.com",
    box_account: "box-design-mori",
    center_cd: "kyoto",
    center: "京都R&D",
  },
  {
    user_cd: "sales-kato",
    user_name: "営業 加藤",
    email: "sales.kato@example.com",
    box_account: "box-sales-kato",
    center_cd: "nagoya",
    center: "名古屋拠点",
  },
  {
    user_cd: "cs-yamamoto",
    user_name: "CS 山本",
    email: "cs.yamamoto@example.com",
    box_account: "box-cs-yamamoto",
    center_cd: "kobe",
    center: "神戸CS",
  },
  {
    user_cd: "backend-ono",
    user_name: "Backend 小野",
    email: "backend.ono@example.com",
    box_account: "box-backend-ono",
    center_cd: "hiroshima",
    center: "広島サポート",
  },
  {
    user_cd: "frontend-kimura",
    user_name: "Frontend 木村",
    email: "frontend.kimura@example.com",
    box_account: "box-frontend-kimura",
    center_cd: "takasaki",
    center: "高崎工場",
  },
  {
    user_cd: "ml-nakagawa",
    user_name: "ML 中川",
    email: "ml.nakagawa@example.com",
    box_account: "box-ml-nakagawa",
    center_cd: "tsukuba",
    center: "つくば研究所",
  },
  {
    user_cd: "hr-matsumoto",
    user_name: "人事 松本",
    email: "hr.matsumoto@example.com",
    box_account: "box-hr-matsumoto",
    center_cd: "tokyo",
    center: "東京センター",
  },
  {
    user_cd: "finance-ogawa",
    user_name: "経理 小川",
    email: "finance.ogawa@example.com",
    box_account: "box-finance-ogawa",
    center_cd: "osaka",
    center: "大阪DR",
  },
  {
    user_cd: "legal-inoue",
    user_name: "法務 井上",
    email: "legal.inoue@example.com",
    box_account: "box-legal-inoue",
    center_cd: "sendai",
    center: "仙台サテライト",
  },
];

export const mockUserDb = {
  get(userCd: string): UserInfo | undefined {
    const hit = db.find((u) => u.user_cd === userCd);
    return hit
      ? {
          user: {
            user_cd: hit.user_cd,
            user_name: hit.user_name,
            user_account: hit.user_account,
            email: hit.email,
            box_account: hit.box_account,
            center: hit.center
              ? [
                  {
                    center_cd: hit.center,
                    belonging_flg: 0,
                  },
                ]
              : [],
            language_code: hit.language_code ?? 0,
            perm_cd: hit.perm_cd ?? "standard",
          },
          user_cd: hit.user_cd,
          disp_name: hit.user_name,
          email: hit.email,
          box_user_id: hit.box_account,
          center: hit.center
            ? [
                {
                  center_cd: hit.center,
                  belonging_flg: 0,
                },
              ]
            : [],
        }
      : undefined;
  },

  list(params: {
    user_name?: string;
    user_account?: string;
    user_email?: string;
    center_cd_list?: string | string[];
    page?: number;
    per_page?: number;
  }): PaginationResultMUser {
    const {
      user_name,
      user_account,
      user_email,
      center_cd_list,
      page = 1,
      per_page = 10,
    } = params;

    let rows = db;
    if (user_name)
      rows = rows.filter((u) =>
        u.user_name.toLowerCase().includes(user_name.toLowerCase()),
      );
    if (user_account)
      rows = rows.filter((u) =>
        u.user_cd.toLowerCase().includes(user_account.toLowerCase()),
      );
    if (user_email)
      rows = rows.filter((u) =>
        u.email.toLowerCase().includes(user_email.toLowerCase()),
      );
    if (
      center_cd_list &&
      (Array.isArray(center_cd_list) ? center_cd_list.length : true)
    ) {
      const list = Array.isArray(center_cd_list)
        ? center_cd_list
        : [center_cd_list];
      rows = rows.filter((u) => list.includes(u.center ?? ""));
    }

    const total = rows.length;
    const start = (page - 1) * per_page;
    const data = rows.slice(start, start + per_page).map((u) => ({
      user: {
        user_cd: u.user_cd,
        user_name: u.user_name,
        user_account: u.user_account,
        email: u.email,
        box_account: u.box_account,
        center: u.center
          ? [
              {
                center_cd: u.center,
                belonging_flg: 0,
              },
            ]
          : [],
        language_code: u.language_code ?? 0,
        perm_cd: u.perm_cd ?? "standard",
      },
      // 互換のためトップレベルにもフィールドを展開
      user_cd: u.user_cd,
      disp_name: u.user_name,
      email: u.email,
      box_user_id: u.box_account,
      center: u.center
        ? [
            {
              center_cd: u.center,
              belonging_flg: 0,
            },
          ]
        : [],
    }));

    const pagination: PaginationResultMUser["pagination"] = {
      total,
      page,
      per_page,
      current_page: page,
      last_page: Math.max(1, Math.ceil(total / per_page)),
      from: total === 0 ? 0 : start + 1,
      to: Math.min(total, start + per_page),
      first_page_url: `/api/users?page=1&per_page=${per_page}`,
      prev_page_url:
        page > 1 ? `/api/users?page=${page - 1}&per_page=${per_page}` : null,
      next_page_url:
        start + per_page < total
          ? `/api/users?page=${page + 1}&per_page=${per_page}`
          : null,
      last_page_url: `/api/users?page=${Math.max(1, Math.ceil(total / per_page))}&per_page=${per_page}`,
    };

    return {
      data,
      items: data, // 互換用
      pagination,
    };
  },

  update(userCd: string, payload: Partial<MockUser>) {
    const idx = db.findIndex((u) => u.user_cd === userCd);
    if (idx === -1) return false;
    db[idx] = { ...db[idx], ...payload };
    return true;
  },

  remove(userCd: string) {
    const idx = db.findIndex((u) => u.user_cd === userCd);
    if (idx === -1) return false;
    db.splice(idx, 1);
    return true;
  },
};
