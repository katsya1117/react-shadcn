import type { SearchSetConditionItem } from '@/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const SearchSetMode = {
  Search: 'Search',
  Save: 'Save',
} as const
export type SearchSetMode = (typeof SearchSetMode)[keyof typeof SearchSetMode]

type Props = {
  user_cd: string
  mode: SearchSetMode
  condition: SearchSetConditionItem[]
  defaultConditions?: SearchSetConditionItem[]
  onHandleSearch: () => void
  onHandleModuleChange: (next: SearchSetMode) => void
  onSetDefaultConditions: (items: SearchSetConditionItem[]) => void
  onConditionsChange?: (items: SearchSetConditionItem[]) => void
}

export const SearchSet = ({
  user_cd,
  mode,
  condition,
  defaultConditions = [],
  onHandleSearch,
  onHandleModuleChange,
  onSetDefaultConditions,
  onConditionsChange,
}: Props) => {
  const activeCount = condition.length
  const addCondition = () => {
    const next = [...condition, { field: 'status', op: '=', value: '実行中' }]
    onConditionsChange?.(next)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>検索条件ヘッダー</CardTitle>
            <CardDescription>条件入力は下の Conditions で管理します</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border border-border px-2 py-1">モード: {mode}</span>
            <span className="rounded-md border border-border px-2 py-1">
              条件数: {condition.length}
            </span>
            <span className="rounded-md border border-border px-2 py-1">
              デフォルト: {defaultConditions.length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-border px-2 py-1">ユーザー: {user_cd || '未設定'}</span>
          <span className="rounded-md border border-border px-2 py-1">稼働中 {activeCount}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onHandleModuleChange('Search')}>
            検索モード
          </Button>
          <Button size="sm" variant="outline" onClick={() => onHandleModuleChange('Save')}>
            保存モード
          </Button>
          <Button size="sm" variant="secondary" onClick={addCondition}>
            条件追加
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSetDefaultConditions(condition)}>
            条件保存
          </Button>
          <Button size="sm" onClick={onHandleSearch}>
            検索を実行
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
