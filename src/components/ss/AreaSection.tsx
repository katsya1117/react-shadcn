import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** セクションの色味。所属（primary）と、共有（sky）で分ける */
export type AreaTone = "primary" | "sky";

const toneClasses: Record<
  AreaTone,
  { chip: string; eyebrow: string; count: string }
> = {
  primary: {
    chip: "bg-primary/10 text-primary ring-primary/20",
    eyebrow: "text-primary/70",
    count: "bg-primary/10 text-primary",
  },
  sky: {
    chip: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
    eyebrow: "text-sky-600/80 dark:text-sky-400/80",
    count: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
};

/**
 * ランチャーの区分け 1 つ分（見出し + カード一覧）。
 * 見出しは「アイコン / 英字の小見出し + タイトル + 件数」で作り、全体を角丸の薄いグレーのブロックで囲む
 * （二つの区分けを、ブロックで分ける。カードは平らに載せる）。
 */
export const AreaSection = ({
  id,
  eyebrow,
  title,
  description,
  icon,
  tone,
  count,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone: AreaTone;
  /** 件数。未取得のときは undefined にして表示しない */
  count?: number;
  children: ReactNode;
}) => {
  const t = toneClasses[tone];
  return (
    <section
      className="space-y-4 rounded-2xl bg-slate-200/50 p-5 dark:bg-slate-800/50"
      aria-labelledby={id}
    >
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
              t.chip,
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.25em]",
                t.eyebrow,
              )}
            >
              {eyebrow}
            </p>
            <div className="flex items-center gap-2">
              <h2 id={id} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                    t.count,
                  )}
                >
                  {count}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
};
