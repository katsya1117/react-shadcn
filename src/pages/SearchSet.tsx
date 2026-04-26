import { useMemo } from 'react'

type SearchSetConditionItem = { field: string; op: string; value: string }
type SearchSetMode = 'Search' | 'Save'

type SearchSetProps = {
  user_cd: string
  mode: SearchSetMode
  condition: SearchSetConditionItem[]
  onHandleSearch: () => void
  onHandleModuleChange: (next: SearchSetMode) => void
  onSetDefaultConditions: (items: SearchSetConditionItem[]) => void
}

const SearchSet = ({
  user_cd,
  mode,
  condition,
  onHandleSearch,
  onHandleModuleChange,
  onSetDefaultConditions,
}: SearchSetProps) => {
  const stats = useMemo(
    () => ({
      active: condition.length,
      failed: 0,
    }),
    [condition],
  )

  // 操作系を集約したヘッダーバー（フォームは Conditions 側で描画）
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-border px-2 py-1">
          ユーザー: {user_cd || '未設定'}
        </span>
        <span className="rounded-md border border-border px-2 py-1">モード: {mode}</span>
        <span className="rounded-md border border-border px-2 py-1">条件数: {condition.length}</span>
        <span className="rounded-md border border-border px-2 py-1">稼働中 {stats.active}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          className="rounded-md border border-border px-2 py-1"
          onClick={() => onHandleModuleChange('Search')}
        >
          検索モード
        </button>
        <button
          className="rounded-md border border-border px-2 py-1"
          onClick={() => onHandleModuleChange('Save')}
        >
          保存モード
        </button>
        <button
          className="rounded-md border border-border px-2 py-1"
          onClick={() => onSetDefaultConditions(condition)}
        >
          条件保存
        </button>
        <button
          className="rounded-md border border-primary text-primary px-2 py-1"
          onClick={onHandleSearch}
        >
          検索を実行
        </button>
      </div>
    </div>
  )
}

export default SearchSet
