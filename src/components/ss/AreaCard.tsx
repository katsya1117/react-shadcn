import type { ComponentProps, ReactNode } from "react";

import BoxIcon from "@/components/icons/BoxIcon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Folder, FolderOpen } from "lucide-react";

/** カード左のフォルダアイコン。所属・共有で共通 */
export const AreaFolderIcon = () => (
  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
);

/**
 * 領域カードの外枠。左に情報、右端にボタン群を置く横並びの行。
 * 影や装飾は付けず、ホバーでは枠の色だけ変える。所属・共有で共通
 */
export const AreaCard = ({
  children,
  actions,
  muted = false,
  className,
}: {
  children: ReactNode;
  /** 右端に寄せるボタン群 */
  actions: ReactNode;
  /** 見つからない領域などを、グレー表示にする */
  muted?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:border-foreground/20",
      muted && "opacity-60",
      className,
    )}
  >
    <AreaFolderIcon />
    <div className="min-w-0 flex-1">{children}</div>
    <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
  </div>
);

/** ボタン群の区切り線 */
export const AreaActionDivider = () => (
  <span className="mx-1 h-4 w-px bg-border" aria-hidden />
);

/** カード内のアイコンボタン（ツールチップつき） */
export const AreaIconButton = ({
  label,
  className,
  children,
  ...props
}: {
  /** aria-label とツールチップの文言 */
  label: string;
} & Omit<ComponentProps<typeof Button>, "aria-label">) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
          className,
        )}
        aria-label={label}
        {...props}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const openLink = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

/** Box ブラウザ / Box Drive の 2 つのボタン */
export const BoxLinkButtons = ({
  webBoxUrl,
  boxDriveUrl,
  disabled = false,
}: {
  webBoxUrl: string;
  boxDriveUrl: string;
  disabled?: boolean;
}) => (
  <>
    <AreaIconButton
      label="Box ブラウザ"
      disabled={disabled}
      onClick={() => openLink(webBoxUrl)}
    >
      <BoxIcon className="h-4 w-4 aspect-square object-contain" aria-hidden />
    </AreaIconButton>
    <AreaIconButton
      label="Box Drive"
      disabled={disabled}
      onClick={() => openLink(boxDriveUrl)}
    >
      <FolderOpen className="h-4 w-4" aria-hidden />
    </AreaIconButton>
  </>
);
