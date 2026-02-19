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
  center_cd_list?: string[]
  delete_flag?: boolean
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export type UserUpdateParams = {
  user_cd: string
  user_name?: string
  email?: string
  center?: string
  box_account?: string
}

export type UserInfo = {
  user?: {
    user_cd: string
    user_name?: string
    email?: string
    box_account?: string
    center?: string
  }
}

export type PaginationResultMUser = {
  data: UserInfo[]
  pagination: {
    total: number
    page: number
    per_page: number
  }
}

export type AccessToken = string

export class UsersApi {
  // config is ignored in mock
  constructor(public config?: any) {}

  async getUser(userCd: string, _opts?: any) {
    const { mockUserDb } = await import("./mock/usersDb")
    const data: UserInfo = mockUserDb.get(userCd) ?? { user: { user_cd: userCd } }
    return { data }
  }

  async getUserList(
    user_name?: string,
    user_account?: string,
    user_email?: string,
    center_cd_list?: string[],
    delete_flag?: boolean,
    sort?: string,
    order?: 'asc' | 'desc',
    page: number = 1,
    per_page: number = 10,
    _opts?: any,
  ) {
    const { mockUserDb } = await import("./mock/usersDb")
    const data: PaginationResultMUser = mockUserDb.list({
      user_name,
      user_account,
      user_email,
      center_cd_list,
      page,
      per_page,
    })
    return { data }
  }

  async updateUser(
    userCd: string,
    param: Omit<UserUpdateParams, 'user_cd'>,
    _opts?: any,
  ) {
    const { mockUserDb } = await import("./mock/usersDb")
    const patch: {
      user_name?: string
      email?: string
      center?: string
      box_account?: string
    } = {}
    if (param.user_name !== undefined) patch.user_name = param.user_name
    if (param.email !== undefined) patch.email = param.email
    if (param.center !== undefined) patch.center = param.center
    if (param.box_account !== undefined) patch.box_account = param.box_account

    const updated = mockUserDb.update(userCd, patch)
    return { data: updated ? mockUserDb.get(userCd) ?? null : null }
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
  constructor(public config?: any) {}

  async getCenterList(
    center_name?: string,
    user_list?: string[],
    sort?: string,
    order: "asc" | "desc" = "asc",
    page: number = 1,
    per_page: number = 10,
    _opts?: any,
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

  async getCenter(center_cd: string, _opts?: any) {
    return {
      data: {
        center_cd,
        center_name: `センター ${center_cd}`,
        folder_name: `/centers/${center_cd}`,
        guest: false,
      } as CenterInfo,
    }
  }

  async createCenter(_params: CenterCreationParams, _opts?: any) {
    return { data: "created" }
  }
}

// ---------- AutoComplete (mock) ----------
export class AutoCompleteApi {
  constructor(public config?: any) {}

  async getList(_opts?: any) {
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
  constructor(public config?: any) {}

  async getBoxAccountId(userCd: string, _opts?: any) {
    return { data: `box-${userCd}` }
  }

  async getContentsPickerToken(accountId: string, _opts?: any) {
    const token: AccessToken = `token-${accountId}`
    return { data: token }
  }
}
