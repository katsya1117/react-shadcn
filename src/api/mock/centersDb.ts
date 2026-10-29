import type {
  CenterCreationParams,
  CenterInfo,
  CenterListItem,
  CenterUpdateParams,
  PaginationResultCenterListItem,
} from "../index";

type MockCenter = Omit<CenterListItem, "members"> & {
  // メンバー逆引き用のユーザー名一覧（件数が members になる）
  member_names: string[];
};

// シンプルなインメモリDB（セッション中のみ保持）
const db: MockCenter[] = [
  {
    center_cd: "c001",
    center_name: "東京センター",
    folder_name: "/tokyo",
    guest: false,
    type: "所属",
    site: "横浜",
    member_names: ["佐藤 健", "田中 美咲", "鈴木 大輔", "山本 花子"],
  },
  {
    center_cd: "c002",
    center_name: "大阪DR",
    folder_name: "/osaka-dr",
    guest: true,
    type: "所属",
    site: "中部",
    member_names: ["中村 翔", "伊藤 恵子"],
  },
  {
    center_cd: "c003",
    center_name: "監査チーム",
    folder_name: "/audit",
    guest: false,
    type: "カスタマイズ",
    site: "横浜",
    member_names: ["佐藤 健"],
  },
];

export const mockCenterDb = {
  get(center_cd: string): CenterInfo | undefined {
    const hit = db.find((c) => c.center_cd === center_cd);
    if (!hit) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { member_names, ...info } = hit;
    return info;
  },

  create(param: CenterCreationParams): string {
    if (db.some((c) => c.center_name === param.center_name)) {
      throw new Error("同名のセンターが既に存在します。");
    }
    const next = Math.max(0, ...db.map((c) => Number(c.center_cd.slice(1)))) + 1;
    const center_cd = `c${String(next).padStart(3, "0")}`;
    db.push({
      center_cd,
      center_name: param.center_name,
      folder_name: param.folder_name ?? "",
      guest: false,
      type: param.type ?? "カスタマイズ",
      site: param.site ?? "",
      member_names: [],
    });
    return center_cd;
  },

  update(center_cd: string, patch: CenterUpdateParams): boolean {
    const idx = db.findIndex((c) => c.center_cd === center_cd);
    if (idx === -1) return false;
    db[idx] = { ...db[idx], ...patch };
    return true;
  },

  remove(center_cd: string): boolean {
    const idx = db.findIndex((c) => c.center_cd === center_cd);
    if (idx === -1) return false;
    db.splice(idx, 1);
    return true;
  },

  list(params: {
    center_name?: string;
    user_list?: string[];
    page?: number;
    per_page?: number;
  }): PaginationResultCenterListItem {
    const { center_name, user_list, page = 1, per_page = 10 } = params;

    let rows = db;
    if (center_name)
      rows = rows.filter((c) =>
        c.center_name.toLowerCase().includes(center_name.toLowerCase()),
      );
    if (user_list && user_list.length > 0) {
      rows = rows.filter((c) =>
        user_list.some((name) =>
          c.member_names.some((m) => m.includes(name)),
        ),
      );
    }

    const total = rows.length;
    const start = (page - 1) * per_page;
    const lastPage = Math.max(1, Math.ceil(total / per_page));
    const data: CenterListItem[] = rows
      .slice(start, start + per_page)
      .map(({ member_names, ...rest }) => ({
        ...rest,
        members: member_names.length,
      }));

    return {
      data,
      items: data, // UserManage と揃えるための互換エイリアス
      pagination: {
        total,
        current_page: page,
        last_page: lastPage,
        per_page,
        from: total === 0 ? 0 : start + 1,
        to: Math.min(total, start + per_page),
        first_page_url: `/api/centers?page=1&per_page=${per_page}`,
        prev_page_url:
          page > 1 ? `/api/centers?page=${page - 1}&per_page=${per_page}` : null,
        next_page_url:
          start + per_page < total
            ? `/api/centers?page=${page + 1}&per_page=${per_page}`
            : null,
        last_page_url: `/api/centers?page=${lastPage}&per_page=${per_page}`,
      },
    };
  },
};
