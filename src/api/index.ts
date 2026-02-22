import type { MultiValue } from "react-select";

export type SearchSetConditionItem = {
  field: string
  op: string
  value: string
}

export type JobSearchParams = {
  language: string
  user_cd: string
  center_name: string
  search_condition_list: string
  operation: string
  status_definition: string
  sort: string
  order: 'asc' | 'desc'
  page: number
  per_page?: number
}

// 共通で使うページネーションレスポンス（Laravel風）
export type Pagination = {
  current_page: number
  last_page: number
  per_page: number
  from: number
  to: number
  total: number
  first_page_url: string
  prev_page_url: string | null
  next_page_url: string | null
  last_page_url: string
}

// ---- Additional mock types/APIs used by redux slices ----

export type AutoCompleteData = {
  label: string
  value: string
  color?: string
}

export type UserSearchParams = {
  user_name?: string
  user_account?: string
  user_email?: string
  center_cd_list?: string | string[]
  delete_flag?: boolean
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  per_page?: number
  auto_complete?: MultiValue<AutoCompleteData>

  // ADユーザー検索用パラメータ（UserCreate で利用）
  disp_name?: string
  account_name?: string
  mail_addr?: string
  organization_unit?: string
  distinguished_name?: string
  status?: string
}

// AD連携の検索結果アイテム（UserCreate で利用）
export type AdUserList = {
  mail_addr: string
  account_name: string
  disp_name: string
  organization_unit?: string
  distinguished_name?: string
  status1?: string
  status2?: string
}

// ADユーザーをアプリに登録する際のパラメータ
export type UserCreationParams = {
  user_cd: string
  disp_name: string
  account: string
  email: string
  language_code: number
}

export type UserUpdateParams = {
  user_cd?: string
  user_name?: string
  disp_name?: string
  account?: string
  email?: string
  center?: string
  center_cd?: string
  box_account?: string
  language_code?: number
  perm_cd?: string
}

export type UserCenterInfo = {
  center_cd: string
  belonging_flg?: number
}

export type UserInfo = {
  user: {
    // user_cd は比較式で boolean 扱いされることがあるため幅広く許容
    user_cd: string | boolean
    user_name?: string
    user_account?: string
    email?: string
    box_account?: string
    center?: UserCenterInfo[]
    language_code?: number
    perm_cd?: string
  }
  // 互換用のトップレベル項目（既存画面が参照）
  user_cd: string
  disp_name?: string
  email?: string
  box_user_id?: string
  center?: UserCenterInfo[]
}

// 権限テンプレート（最小構成のモック）
export type DefaultSelection36PermissionPayload = {
  perm_cd: string
  perm_name: string
  id?: number
  can_group_adduser?: number
  can_status_force_close?: number
  can_status_openclose?: number
  search_cd1?: number
  search_cd2?: number
  search_cd3?: number
  // 個別権限フラグ（0/1）
  can_job_create?: number
  can_status_import?: number
  can_access_authority?: number
  can_status_change?: number
  can_job_change_expiry?: number
  can_job_change?: number
  can_status_reissue?: number
  can_job_arrow_user?: number
  can_log_search?: number
  can_manage?: number
  can_ng_word?: number
  can_auto_delete?: number
}

export type PaginationResultMUser = {
  data: UserInfo[]
  items: UserInfo[] // UserManage は items を参照するため互換用エイリアス
  pagination: Pagination
}

export type AccessToken = string

export class UsersApi {
  // config is ignored in mock
  constructor(public config?: unknown) {}

  async getUser(userCd: string, _opts?: unknown) {
    const { mockUserDb } = await import("./mock/usersDb")
    const data: UserInfo = mockUserDb.get(userCd) ?? { user: { user_cd: userCd } }
    return { data }
  }

  async getUserList(param: UserSearchParams, _opts?: unknown) {
    const {
      user_name,
      user_account,
      user_email,
      center_cd_list,
      auto_complete,
      page = 1,
      per_page = 10,
    } = param ?? {}

    const { userManageMock } = await import("./mock/userManageList")

    const centers =
      center_cd_list ??
      (auto_complete ? auto_complete.map((c) => c.value) : undefined)

    let rows = userManageMock
    if (user_name) {
      const q = user_name.toLowerCase()
      rows = rows.filter((u) => (u.disp_name ?? "").toLowerCase().includes(q))
    }
    if (user_account) {
      const q = user_account.toLowerCase()
      rows = rows.filter((u) => u.user_cd.toLowerCase().includes(q))
    }
    if (user_email) {
      const q = user_email.toLowerCase()
      rows = rows.filter((u) => (u.email ?? "").toLowerCase().includes(q))
    }
    if (centers && (Array.isArray(centers) ? centers.length : true)) {
      const list = Array.isArray(centers) ? centers : String(centers).split(",")
      rows = rows.filter((u) =>
        u.center?.some((c) => list.includes(c.center_cd ?? "")),
      )
    }

    const total = rows.length
    const start = (page - 1) * per_page
    const items = rows.slice(start, start + per_page)
    const last_page = Math.max(1, Math.ceil(total / per_page))
    const pagination: Pagination = {
      current_page: page,
      last_page,
      per_page,
      from: total === 0 ? 0 : start + 1,
      to: Math.min(total, start + per_page),
      total,
      first_page_url: `/api/users?page=1&per_page=${per_page}`,
      prev_page_url:
        page > 1 ? `/api/users?page=${page - 1}&per_page=${per_page}` : null,
      next_page_url:
        start + per_page < total
          ? `/api/users?page=${page + 1}&per_page=${per_page}`
          : null,
      last_page_url: `/api/users?page=${last_page}&per_page=${per_page}`,
    }

    const data: PaginationResultMUser = {
      data: items,
      items,
      pagination,
    }
    return { data }
  }

  async updateUser(
    userCd: string,
    param: Omit<UserUpdateParams, 'user_cd'>,
    _opts?: unknown,
  ) {
    const { mockUserDb } = await import("./mock/usersDb")
    const patch: {
      user_name?: string
      user_account?: string
      email?: string
      center?: string
      box_account?: string
      language_code?: number
      perm_cd?: string
    } = {}
    if (param.user_name !== undefined) patch.user_name = param.user_name
    if (param.disp_name !== undefined) patch.user_name = param.disp_name
    if (param.account !== undefined) patch.user_account = param.account
    if (param.email !== undefined) patch.email = param.email
    if (param.center_cd !== undefined) patch.center = param.center_cd
    if (param.center !== undefined) patch.center = param.center
    if (param.box_account !== undefined) patch.box_account = param.box_account
    if (param.language_code !== undefined) patch.language_code = param.language_code
    if (param.perm_cd !== undefined) patch.perm_cd = param.perm_cd

    const updated = mockUserDb.update(userCd, patch)
    return { data: updated ? mockUserDb.get(userCd) ?? null : null }
  }

  async removeUser(userCd: string, _opts?: unknown) {
    const { mockUserDb } = await import("./mock/usersDb")
    const ok = mockUserDb.remove(userCd)
    return { data: ok }
  }
}

// ---------- SearchSet (mock) ----------
export class SearchSetApi {
  constructor(public config?: unknown) {}

  async clearSearchSet(userCd: string, _opts?: unknown) {
    // 実際はユーザーの検索条件を初期化する API 想定
    return { data: { user_cd: userCd, cleared: true } }
  }
}

// ---------- Center (mock) ----------
export type CenterCreationParams = {
  center_name: string
  folder_name?: string
}

export type CenterInfo = {
  center_cd: string
  center_name: string
  folder_name: string
  guest?: boolean
}

export type CenterSearchParams = {
  center_name?: string
  user_list?: string[]
  sort?: string
  order?: "asc" | "desc"
  page?: number
  per_page?: number
}

export type PaginationResultCenterListItem = {
  data: CenterInfo[]
  pagination: {
    total: number
    page: number
    per_page: number
  }
}

export class CenterApi {
  constructor(public config?: unknown) {}

  async getCenterList(
    center_name?: string,
    user_list?: string[],
    page: number = 1,
    per_page: number = 10,
  ) {
    const data: PaginationResultCenterListItem = {
      data: [
        {
          center_cd: "c001",
          center_name: "東京センター",
          folder_name: "/tokyo",
          guest: false,
        },
        {
          center_cd: "c002",
          center_name: "大阪DR",
          folder_name: "/osaka-dr",
          guest: true,
        },
      ],
      pagination: { total: 2, page, per_page },
    }
    return { data }
  }

  async getCenter(center_cd: string) {
    return {
      data: {
        center_cd,
        center_name: `センター ${center_cd}`,
        folder_name: `/centers/${center_cd}`,
        guest: false,
      } as CenterInfo,
    }
  }

  async createCenter() {
    return { data: "created" }
  }
}

// ---------- AutoComplete (mock) ----------
export class AutoCompleteApi {
  constructor(public config?: unknown) {}

  async getList() {
    const users = [
      { label: "sre-user", value: "sre-user", color: "#2563eb" },
      { label: "ops-admin", value: "ops-admin", color: "#10b981" },
      { label: "dev-lead", value: "dev-lead", color: "#f59e0b" },
    ]
    const groups = [
      { label: "東京センター", value: "tokyo", color: "#6366f1" },
      { label: "大阪DR", value: "osaka-dr", color: "#ef4444" },
    ]
    return { data: { users, groups } }
  }
}

export class BoxApi {
  constructor(public config?: unknown) {}

  async getBoxAccountId(userCd: string, _opts?: unknown) {
    return { data: `box-${userCd}` }
  }

  async getContentsPickerToken(accountId: string, _opts?: unknown) {
    const token: AccessToken = `token-${accountId}`
    return { data: token }
  }
}
