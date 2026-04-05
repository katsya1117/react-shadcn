import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Folder,
  FolderOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { DISPLAY_PATH_ROOT } from "./constants";

type PathBarProps = {
  folderName: string;
  relativePath: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onCopyPath: () => void;
  onOpenBox: () => void;
  onOpenExplorer: () => void;
  className?: string;
};

const FolderActionButtons = ({
  onCopyPath,
  onOpenBox,
  onOpenExplorer,
}: {
  onCopyPath: () => void;
  onOpenBox: () => void;
  onOpenExplorer: () => void;
}) => (
  <div className="flex shrink-0 items-center justify-end gap-0.5">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onCopyPath}
          aria-label="パスをコピー"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>パスをコピー</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onOpenBox}
          aria-label="Boxで開く"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Web Boxで開く</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onOpenExplorer}
          aria-label="Box Driveで開く"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Box Driveで開く</TooltipContent>
    </Tooltip>
  </div>
);

export const PathBar = ({
  folderName,
  relativePath,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onCopyPath,
  onOpenBox,
  onOpenExplorer,
  className,
}: PathBarProps) => {
  const displayPath = relativePath
    ? `${DISPLAY_PATH_ROOT}${relativePath}`
    : DISPLAY_PATH_ROOT;
  const pathSegments = relativePath.split("\\").filter(Boolean);
  const hasSplitPath = pathSegments.length > 1;
  const rootPathDisplay = hasSplitPath
    ? `${DISPLAY_PATH_ROOT}\\${pathSegments[0]}`
    : displayPath;
  const middlePathDisplay =
    pathSegments.length > 2 ? `\\${pathSegments.slice(1, -1).join("\\")}` : "";
  const currentPathDisplay = hasSplitPath ? `\\${pathSegments.at(-1) ?? ""}` : "";

  return (
    <div
      className={cn("flex min-w-0 items-end gap-3", className)}
    >
      <div className="min-w-0 flex-1">
        <div className="relative flex min-w-0 items-center gap-1 pb-2 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-border/60">
          {/* 戻る/進むボタン */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                onClick={onGoBack}
                disabled={!canGoBack}
                aria-label="戻る"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>戻る</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                onClick={onGoForward}
                disabled={!canGoForward}
                aria-label="進む"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>進む</TooltipContent>
          </Tooltip>

          <Folder className="h-4 w-4 shrink-0 text-muted-foreground/75" />
          {hasSplitPath ? (
            <div
              className="flex min-w-0 flex-1 items-center font-mono text-sm leading-6 text-foreground/90"
              title={displayPath}
            >
              <span className="shrink-0">{rootPathDisplay}</span>
              {middlePathDisplay ? (
                <span className="min-w-0 shrink truncate">
                  {middlePathDisplay}
                </span>
              ) : null}
              <span className="shrink-0">
                {currentPathDisplay}
              </span>
            </div>
          ) : (
            <div
              className="truncate font-mono text-sm leading-6 text-foreground/90"
              title={displayPath}
            >
              {displayPath || folderName}
            </div>
          )}
        </div>
      </div>

      <FolderActionButtons
        onCopyPath={onCopyPath}
        onOpenBox={onOpenBox}
        onOpenExplorer={onOpenExplorer}
      />
    </div>
  );
};
