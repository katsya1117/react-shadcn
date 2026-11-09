import type { ComponentProps, ReactNode } from "react";

import BoxIcon from "@/components/icons/BoxIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Folder, FolderOpen } from "lucide-react";

import type { AreaTone } from "./AreaSection";

const CARD_TONE_CLASSES: Record<AreaTone, string> = {
  primary: "border-l-primary/30 hover:border-primary/40",
  sky: "border-l-sky-500/40 hover:border-sky-500/50",
};

const ICON_TONE_CLASSES: Record<AreaTone, { chip: string; icon: string }> = {
  primary: {
    chip: "bg-primary/10 ring-primary/10 group-hover:bg-primary/15 group-hover:ring-primary/20",
    icon: "text-primary/70 group-hover:text-primary",
  },
  sky: {
    chip: "bg-sky-500/10 ring-sky-500/20 group-hover:bg-sky-500/15 group-hover:ring-sky-500/30",
    icon: "text-sky-600/80 group-hover:text-sky-600 dark:text-sky-400",
  },
};

/** カード左のフォルダアイコン（角丸のチップ）。所属・共有のカードで共通 */
export const AreaFolderIcon = ({ tone = "primary" }: { tone?: AreaTone }) => (
  <div
    className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-300",
      ICON_TONE_CLASSES[tone].chip,
    )}
  >
    <Folder
      className={cn(
        "h-5 w-5 transition-colors duration-300",
        ICON_TONE_CLASSES[tone].icon,
      )}
    />
  </div>
);

/** 領域カードの外枠（平らな見た目。ホバーでは枠の色だけ変える）。所属・ゲストのカードと、共有のカードで共通 */
export const AreaCard = ({
  children,
  muted = false,
  tone = "primary",
  className,
}: {
  children: ReactNode;
  /** 見つからない領域などを、グレー表示にする */
  muted?: boolean;
  /** 区分けの色味。所属は primary、共有は sky（左端の線、ホバー時の枠・影） */
  tone?: AreaTone;
  className?: string;
}) => (
  <Card
    className={cn(
      "group relative overflow-hidden border-border/60 bg-card shadow-none transition-colors duration-200 hover:shadow-none py-0 gap-0 border-l-2",
      CARD_TONE_CLASSES[tone],
      muted && "opacity-60",
      className,
    )}
  >
    <CardContent className="relative p-4">{children}</CardContent>
  </Card>
);

/** カード内の丸いアイコンボタン（ツールチップつき） */
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
          "h-8 w-8 rounded-full text-muted-foreground/70 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-105",
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
  <div className="flex items-center gap-1">
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
  </div>
);
