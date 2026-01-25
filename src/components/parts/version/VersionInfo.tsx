import type { FC } from 'react'

/**
 * ビルドやリリース番号を表示するためのスタブ。
 * 実データがあれば props 化して置き換えてください。
 */
export const VersionInfo: FC = () => {
  return (
    <div className="text-[11px] text-muted-foreground">
      <span>v0.0.0</span>
    </div>
  )
}

export default VersionInfo
