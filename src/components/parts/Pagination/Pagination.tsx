import { useState } from 'react'

type PaginationPayload = {
  page: number
  per_page: number
  total: number
}

type Props<T> = {
  /**
   * pagination オブジェクトを渡す場合はこちらを使用
   */
  pagination?: PaginationPayload
  /**
   * 個別指定でも可（後方互換）
   */
  page?: number
  perPage?: number
  total?: number
  /**
   * ページ変更ハンドラ（pagination を渡さない場合）
   */
  onPageChange?: (page: number) => void
  /**
   * 件数変更ハンドラ（pagination を渡さない場合）
   */
  onPerPageChange?: (per: number) => void
  /**
   * pagination と一緒に検索パラメータを再発行する汎用ハンドラ
   */
  onHandle?: (params: T) => void
  /**
   * onHandle に渡すパラメータをカスタム生成したい場合
   */
  buildParams?: (page: number, perPage: number) => T
}

export const CustomPagination = <T,>({
  pagination,
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  onHandle,
  buildParams,
}: Props<T>) => {
  const [internalPage, setInternalPage] = useState(page ?? pagination?.page ?? 1)
  const [internalPer, setInternalPer] = useState(perPage ?? pagination?.per_page ?? 10)

  const currentPage = page ?? pagination?.page ?? internalPage
  const currentPer = perPage ?? pagination?.per_page ?? internalPer
  const totalCount = pagination?.total ?? total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / (currentPer || 1)))

  const emitHandle = (nextPage: number, nextPer: number) => {
    if (!onHandle) return
    if (buildParams) {
      onHandle(buildParams(nextPage, nextPer))
    } else {
      onHandle(({ page: nextPage, per_page: nextPer } as unknown) as T)
    }
  }

  const handlePageChange = (next: number) => {
    const safe = Math.min(Math.max(1, next), totalPages)
    if (onHandle) {
      emitHandle(safe, currentPer)
    } else if (onPageChange) {
      onPageChange(safe)
    } else {
      setInternalPage(safe)
    }
  }

  const handlePerChange = (next: number) => {
    const safe = next > 0 ? next : 10
    if (onHandle) {
      emitHandle(1, safe)
    } else if (onPerPageChange) {
      onPerPageChange(safe)
    } else {
      setInternalPer(safe)
      setInternalPage(1)
    }
  }

  const prev = () => handlePageChange(currentPage - 1)
  const next = () => handlePageChange(currentPage + 1)

  const start = totalCount === 0 ? 0 : (currentPage - 1) * currentPer + 1
  const end = Math.min(totalCount, currentPage * currentPer)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <button className="underline disabled:text-muted-foreground" onClick={prev} disabled={currentPage <= 1}>
          前へ
        </button>
        <span>
          {currentPage} / {totalPages}
        </span>
        <button
          className="underline disabled:text-muted-foreground"
          onClick={next}
          disabled={currentPage >= totalPages}
        >
          次へ
        </button>
        <span className="text-xs text-muted-foreground">
          {start} - {end} / {totalCount} 件
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span>表示件数</span>
        <select
          className="rounded-md border border-input bg-background px-2 py-1"
          value={currentPer}
          onChange={(e) => handlePerChange(Number(e.target.value))}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
