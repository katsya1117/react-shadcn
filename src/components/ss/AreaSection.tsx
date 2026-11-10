import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * ランチャーの区分け 1 つ分（見出し + 一覧）。グレーのレーンで囲む。
 * 見出しは固定し、中身があふれたときはレーンの中だけでスクロールする。
 * 見出し左のボタンでセクション全体を折りたためる。
 */
export const AreaSection = ({
  id,
  title,
  open,
  onOpenChange,
  action,
  className,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 見出しの右側に置く要素（絞り込み欄など）。折りたたみ中は出さない */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) => {
  const bodyId = `${id}-body`;

  return (
    <section
      aria-labelledby={id}
      className={cn(
        "flex min-h-0 flex-col gap-2.5 rounded-xl bg-muted p-3",
        className,
      )}
    >
      <header className="flex min-h-8 flex-none items-center justify-between gap-4">
        <h2 id={id} className="min-w-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => onOpenChange(!open)}
            className="flex items-center gap-1.5 rounded-md py-1 pl-1 pr-2 text-sm font-semibold text-foreground transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
            {title}
          </button>
        </h2>
        {open && action}
      </header>

      {open ? (
        // カードの影が切れないよう、スクロール領域に少し余白を持たせる
        <div
          id={bodyId}
          className="-m-1 min-h-0 flex-1 overflow-y-auto p-1"
        >
          {children}
        </div>
      ) : (
        <button
          type="button"
          aria-controls={bodyId}
          aria-expanded={false}
          onClick={() => onOpenChange(true)}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          展開する
        </button>
      )}
    </section>
  );
};
