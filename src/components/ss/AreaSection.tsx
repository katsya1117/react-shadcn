import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * ランチャーの区分け 1 つ分。見出しはグレーのパネルの中の上端に置き（スクロールしない）、
 * 中身があふれたときは見出しの下だけでスクロールする。
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
      className={cn("flex min-h-0 flex-col rounded-2xl bg-muted", className)}
    >
      <header className="flex min-h-8 flex-none items-center justify-between gap-4 px-3 py-2.5">
        <h2 id={id} className="min-w-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? bodyId : undefined}
            onClick={() => onOpenChange(!open)}
            className="flex items-center gap-1.5 rounded-md py-1 pl-1 pr-2 text-sm font-bold text-foreground transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {open && (
        <div
          id={bodyId}
          className="flex min-h-0 flex-1 flex-col px-4 pb-4"
        >
          {/* カードの影が切れないよう、スクロール領域に少し余白を持たせる。
              relative は必須: 中の sr-only（position: absolute）が body 基準で配置されると、
              スクロール外へはみ出してページ全体に余白ができる */}
          <div className="relative -m-1 min-h-0 flex-1 overflow-y-auto p-1">
            {children}
          </div>
        </div>
      )}
    </section>
  );
};
