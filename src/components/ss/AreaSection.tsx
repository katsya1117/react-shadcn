import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * ランチャーの区分け 1 つ分（見出し + 一覧）。グレーのブロックで囲む。
 * 見出しは固定し、中身があふれたときはブロックの中だけでスクロールする。
 */
export const AreaSection = ({
  id,
  title,
  description,
  count,
  action,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  /** 件数。未取得のときは undefined にして表示しない */
  count?: number;
  /** 見出しの右側に置く要素（絞り込み欄など） */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <section
    aria-labelledby={id}
    className={cn("flex min-h-0 flex-col gap-3 rounded-lg bg-muted p-4", className)}
  >
    <header className="flex flex-none items-center justify-between gap-4">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 id={id} className="shrink-0 text-sm font-semibold text-foreground">
          {title}
        </h2>
        {count !== undefined && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {count} 件
          </span>
        )}
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </header>
    <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">{children}</div>
  </section>
);
