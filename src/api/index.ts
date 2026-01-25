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
