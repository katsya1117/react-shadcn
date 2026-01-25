import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type JobStatus = '待機' | '実行中' | '完了' | '失敗'
export type AccessLevel = '閲覧のみ' | '編集可' | 'ブロック'

export interface Job {
  id: string
  title: string
  status: JobStatus
  owner: string
  folder: string
  updatedAt: string
  nextRun: string
  priority: '高' | '中' | '低'
}

export interface FolderAccess {
  name: string
  path: string
  access: AccessLevel
  watchers: string[]
  description?: string
  updatedAt: string
}

export interface Filters {
  keyword: string
  status: 'all' | JobStatus
  owner: 'all' | string
  folder: 'all' | string
  access: 'all' | AccessLevel
  onlyActive: boolean
}

export interface JobState {
  jobs: Job[]
  folders: FolderAccess[]
  filters: Filters
}

const initialState: JobState = {
  jobs: [
    {
      id: 'JOB-1024',
      title: '請求書バッチ',
      status: '実行中',
      owner: '経理',
      folder: '/billing/monthly',
      updatedAt: '2026-01-20T10:30:00Z',
      nextRun: '2026-01-24T02:00:00Z',
      priority: '高',
    },
    {
      id: 'JOB-1025',
      title: '人事マスタ同期',
      status: '待機',
      owner: '人事',
      folder: '/master/hr',
      updatedAt: '2026-01-18T14:10:00Z',
      nextRun: '2026-01-23T23:00:00Z',
      priority: '中',
    },
    {
      id: 'JOB-1026',
      title: 'ログ集計',
      status: '完了',
      owner: 'SRE',
      folder: '/logs/daily',
      updatedAt: '2026-01-22T07:30:00Z',
      nextRun: '2026-01-23T07:00:00Z',
      priority: '中',
    },
    {
      id: 'JOB-1032',
      title: '顧客ステータス再計算',
      status: '失敗',
      owner: 'マーケ',
      folder: '/crm/recompute',
      updatedAt: '2026-01-21T05:25:00Z',
      nextRun: '2026-01-23T05:00:00Z',
      priority: '高',
    },
    {
      id: 'JOB-1038',
      title: 'S3 フォルダ権限チェック',
      status: '実行中',
      owner: 'セキュリティ',
      folder: '/security/audit',
      updatedAt: '2026-01-22T09:45:00Z',
      nextRun: '2026-01-23T09:00:00Z',
      priority: '高',
    },
    {
      id: 'JOB-1040',
      title: 'データレイク圧縮',
      status: '待機',
      owner: 'データ基盤',
      folder: '/datalake/maintenance',
      updatedAt: '2026-01-19T22:15:00Z',
      nextRun: '2026-01-24T01:00:00Z',
      priority: '低',
    },
  ],
  folders: [
    {
      name: 'Billing 月次',
      path: '/billing/monthly',
      access: '編集可',
      watchers: ['経理', 'FinOps'],
      description: '請求関連のジョブと出力が入る月次バッチ領域',
      updatedAt: '2026-01-20T10:00:00Z',
    },
    {
      name: '人事マスタ',
      path: '/master/hr',
      access: '閲覧のみ',
      watchers: ['人事', '情報システム'],
      description: '従業員情報のソースオブトゥルース',
      updatedAt: '2026-01-18T13:00:00Z',
    },
    {
      name: 'セキュリティ監査',
      path: '/security/audit',
      access: '編集可',
      watchers: ['セキュリティ', 'SRE'],
      description: '権限チェックや検査レポートの保存先',
      updatedAt: '2026-01-22T09:00:00Z',
    },
    {
      name: 'CRM 再計算',
      path: '/crm/recompute',
      access: 'ブロック',
      watchers: ['マーケ', 'データ基盤'],
      description: '顧客スコア再計算ジョブのワークスペース',
      updatedAt: '2026-01-21T05:00:00Z',
    },
    {
      name: 'ログ日次',
      path: '/logs/daily',
      access: '閲覧のみ',
      watchers: ['SRE'],
      description: 'システムログのサマリー出力',
      updatedAt: '2026-01-22T07:00:00Z',
    },
  ],
  filters: {
    keyword: '',
    status: 'all',
    owner: 'all',
    folder: 'all',
    access: 'all',
    onlyActive: false,
  },
}

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilter: (
      state,
      action: PayloadAction<{
        key: keyof Filters
        value: Filters[keyof Filters]
      }>,
    ) => {
      const { key, value } = action.payload
      if (key === 'onlyActive') {
        state.filters.onlyActive = Boolean(value)
        return
      }
      if (key === 'status') {
        state.filters.status = value as Filters['status']
        return
      }
      if (key === 'owner') {
        state.filters.owner = value as Filters['owner']
        return
      }
      if (key === 'folder') {
        state.filters.folder = value as Filters['folder']
        return
      }
      if (key === 'access') {
        state.filters.access = value as Filters['access']
        return
      }
      if (key === 'keyword') {
        state.filters.keyword = value as Filters['keyword']
      }
    },
    updateFolderAccess: (
      state,
      action: PayloadAction<{ path: string; access: AccessLevel }>,
    ) => {
      const target = state.folders.find((f) => f.path === action.payload.path)
      if (target) {
        target.access = action.payload.access
        target.updatedAt = new Date().toISOString()
      }
    },
  },
})

export const { setFilter, updateFolderAccess } = jobSlice.actions

const isActiveStatus = (status: JobStatus) => status === '実行中' || status === '待機'

const matchFilters = (job: Job, filters: Filters, folderAccess: AccessLevel | undefined) => {
  if (filters.keyword) {
    const text = `${job.id} ${job.title} ${job.owner}`.toLowerCase()
    if (!text.includes(filters.keyword.toLowerCase())) return false
  }
  if (filters.status !== 'all' && job.status !== filters.status) return false
  if (filters.owner !== 'all' && job.owner !== filters.owner) return false
  if (filters.folder !== 'all' && job.folder !== filters.folder) return false
  if (filters.access !== 'all' && folderAccess && folderAccess !== filters.access) return false
  if (filters.onlyActive && !isActiveStatus(job.status)) return false
  return true
}

export const selectFilters = (state: { jobs: JobState }) => state.jobs.filters
export const selectFolders = (state: { jobs: JobState }) => state.jobs.folders
export const selectJobs = (state: { jobs: JobState }) => state.jobs.jobs

export const selectFilteredJobs = (state: { jobs: JobState }) => {
  const { jobs, folders, filters } = state.jobs
  return jobs
    .map((job) => {
      const folder = folders.find((f) => f.path === job.folder)
      return { job, folder }
    })
    .filter(({ job, folder }) => matchFilters(job, filters, folder?.access))
}

export default jobSlice.reducer
