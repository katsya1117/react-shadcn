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

export type UserInfo = {
  user?: {
    user_cd: string
    user_name?: string
    email?: string
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
    const data: UserInfo = { user: { user_cd: userCd } }
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
    const dummy: UserInfo[] = [
      { user: { user_cd: 'sre-user', user_name: 'SRE' } },
      { user: { user_cd: 'ops-admin', user_name: 'Ops Admin' } },
    ]
    const data: PaginationResultMUser = {
      data: dummy,
      pagination: { total: dummy.length, page, per_page },
    }
    return { data }
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
