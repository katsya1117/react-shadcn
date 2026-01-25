import { useEffect, useState } from 'react'
import type { SearchSetConditionItem } from '@/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Search } from 'lucide-react'

type Props = {
  defaultConditions?: SearchSetConditionItem[]
  onChangeCondition?: (items: SearchSetConditionItem[]) => void
}

export const Conditions = ({ defaultConditions = [], onChangeCondition }: Props) => {
  const [currentConditions, setCurrentConditions] =
    useState<SearchSetConditionItem[]>(defaultConditions)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [owner, setOwner] = useState('all')
  const [folder, setFolder] = useState('all')
  const [access, setAccess] = useState('all')
  const [onlyActive, setOnlyActive] = useState(false)

  useEffect(() => {
    setCurrentConditions(defaultConditions)
  }, [defaultConditions])

  const resetToDefault = () => {
    setCurrentConditions(defaultConditions)
    onChangeCondition?.(defaultConditions)
  }

  const handleAdd = () => {
    const next: SearchSetConditionItem[] = [
      ...currentConditions,
      { field: 'keyword', op: 'includes', value: keyword || '未入力' },
    ]
    setCurrentConditions(next)
    onChangeCondition?.(next)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
        <div className="mb-1 flex items-center justify-between gap-2 font-semibold text-foreground">
          <span>適用中の検索条件</span>
          {onChangeCondition && (
            <button className="text-xs text-primary underline" onClick={resetToDefault}>
              デフォルトに戻す
            </button>
          )}
        </div>
        {currentConditions.length ? (
          <ul className="list-disc pl-5">
            {currentConditions.map((c, idx) => (
              <li key={`${c.field}-${idx}`}>
                {c.field} {c.op} {c.value}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">条件が設定されていません</div>
        )}
      </div>

      <div className="rounded-lg border border-border/70 bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-1">
            <Label className="sr-only">キーワード</Label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="ジョブID / タイトル / 担当"
                className="pl-9"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>ステータス</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">すべて</option>
              <option value="実行中">実行中</option>
              <option value="待機">待機</option>
              <option value="完了">完了</option>
              <option value="失敗">失敗</option>
            </Select>
          </div>
          <div>
            <Label>担当</Label>
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">すべて</option>
            </Select>
          </div>
          <div>
            <Label>フォルダ</Label>
            <Select value={folder} onChange={(e) => setFolder(e.target.value)}>
              <option value="all">すべて</option>
            </Select>
          </div>
          <div>
            <Label>フォルダ権限</Label>
            <Select value={access} onChange={(e) => setAccess(e.target.value)}>
              <option value="all">すべて</option>
              <option value="編集可">編集可</option>
              <option value="閲覧のみ">閲覧のみ</option>
              <option value="ブロック">ブロック</option>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border/80 px-3">
            <Switch checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} aria-label="稼働中のみ" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">稼働中のみ</span>
              <span className="text-xs text-muted-foreground">実行中 / 待機のみ表示</span>
            </div>
          </div>
        </div>
        {onChangeCondition && (
          <div className="mt-3 flex justify-end">
            <button
              className="rounded-md border border-primary text-primary px-3 py-2 text-sm"
              onClick={handleAdd}
            >
              条件に追加
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
