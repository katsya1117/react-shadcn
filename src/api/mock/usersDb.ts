import type { PaginationResultMUser, UserInfo } from "../index";

type MockUser = {
  user_cd: string;
  user_name: string;
  user_account?: string;
  email: string;
  box_account?: string;
  center?: string;
  language_code?: number;
  perm_cd?: string;
};

// シンプルなインメモリDB（セッション中のみ保持）
const db: MockUser[] = [
  { user_cd: "u001", user_name: "山田 太郎", email: "taro@example.com", box_account: "box-taro", center: "東京センター" },
  { user_cd: "u002", user_name: "鈴木 花子", email: "hanako@example.com", box_account: "box-hanako", center: "大阪DR" },
  { user_cd: "sre-user", user_name: "SRE", email: "sre@example.com", box_account: "box-sre", center: "東京センター" },
  { user_cd: "ops-admin", user_name: "Ops Admin", email: "ops@example.com", box_account: "box-ops", center: "大阪DR" },
  { user_cd: "dev-lead", user_name: "開発リード", email: "devlead@example.com", box_account: "box-dev", center: "名古屋拠点" },
  { user_cd: "qa-tester", user_name: "QA テスター", email: "qa@example.com", box_account: "box-qa", center: "福岡センター" },
  { user_cd: "data-analyst", user_name: "データアナリスト", email: "data@example.com", box_account: "box-data", center: "札幌DC" },
  { user_cd: "security-eng", user_name: "セキュリティ", email: "sec@example.com", box_account: "box-sec", center: "横浜監査室" },
  { user_cd: "helpdesk", user_name: "ヘルプデスク", email: "help@example.com", box_account: "box-help", center: "神戸CS" },
  { user_cd: "pm-sato", user_name: "PM 佐藤", email: "pm.sato@example.com", box_account: "box-pm-sato", center: "京都R&D" },
  { user_cd: "pm-suzuki", user_name: "PM 鈴木", email: "pm.suzuki@example.com", box_account: "box-pm-suzuki", center: "仙台サテライト" },
  { user_cd: "designer-kato", user_name: "デザイナー 加藤", email: "design.kato@example.com", box_account: "box-design", center: "広島サポート" },
  { user_cd: "infra-yamada", user_name: "インフラ 山田", email: "infra@example.com", box_account: "box-infra", center: "つくば研究所" },
  { user_cd: "backend-kimura", user_name: "Backend 木村", email: "backend@example.com", box_account: "box-backend", center: "高崎工場" },
  { user_cd: "frontend-hayashi", user_name: "Frontend 林", email: "frontend@example.com", box_account: "box-frontend", center: "東京センター" },
  { user_cd: "sales-tanaka", user_name: "営業 田中", email: "sales@example.com", box_account: "box-sales", center: "大阪DR" },
  { user_cd: "cs-nakamura", user_name: "CS 中村", email: "cs@example.com", box_account: "box-cs", center: "福岡センター" },
  { user_cd: "legal-kondo", user_name: "法務 近藤", email: "legal@example.com", box_account: "box-legal", center: "名古屋拠点" },
  { user_cd: "auditor-mori", user_name: "監査 森", email: "audit.mori@example.com", box_account: "box-audit", center: "横浜監査室" },
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
    if (user_name) rows = rows.filter((u) => u.user_name.toLowerCase().includes(user_name.toLowerCase()));
    if (user_account) rows = rows.filter((u) => u.user_cd.toLowerCase().includes(user_account.toLowerCase()));
    if (user_email) rows = rows.filter((u) => u.email.toLowerCase().includes(user_email.toLowerCase()));
    if (center_cd_list && (Array.isArray(center_cd_list) ? center_cd_list.length : true)) {
      const list = Array.isArray(center_cd_list) ? center_cd_list : [center_cd_list];
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
      prev_page_url: page > 1 ? `/api/users?page=${page - 1}&per_page=${per_page}` : null,
      next_page_url:
        start + per_page < total ? `/api/users?page=${page + 1}&per_page=${per_page}` : null,
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
