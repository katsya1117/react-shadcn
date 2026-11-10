import type { SharedAreaItem } from "@/api";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PATH_SEPARATOR,
  ROLE_LABELS,
  buildBoxDriveUrl,
  buildFullPath,
  buildWebBoxUrl,
} from "@/lib/sharedArea";
import { FolderSymlink } from "lucide-react";

import { AreaCard, BoxLinkButtons } from "./AreaCard";

/**
 * 他センターから共有されたフォルダ 1 つ分の横長パネル。
 * 1 行目は「センターコード › フォルダ名」とロール、2 行目にセンター名のピル。
 * 途中のパスはツールチップでだけ見せる。
 */
export const SharedAreaCard = ({ item }: { item: SharedAreaItem }) => {
  const isMissing = item.status === "missing";
  const fullPathText = buildFullPath(item).join(PATH_SEPARATOR);

  return (
    <li>
      <AreaCard
        icon={FolderSymlink}
        muted={isMissing}
        className="py-2"
        actions={
          <BoxLinkButtons
            webBoxUrl={buildWebBoxUrl(item.folderId)}
            boxDriveUrl={buildBoxDriveUrl(item)}
            disabled={isMissing}
          />
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="flex min-w-0 items-baseline gap-1.5 text-[13px] leading-5 font-semibold text-foreground">
                <span className="shrink-0">{item.centerName}</span>
                <span className="shrink-0 font-normal text-muted-foreground/70" aria-hidden>
                  ›
                </span>
                <span className="truncate">{item.folderName}</span>
                <span className="sr-only">（{fullPathText}）</span>
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-md break-all">
              {fullPathText}
            </TooltipContent>
          </Tooltip>
          <Badge
            variant="outline"
            className="h-4 shrink-0 rounded-full border-border/70 px-1.5 text-[10px] leading-none font-normal text-muted-foreground"
          >
            {ROLE_LABELS[item.role]}
          </Badge>
          {isMissing && (
            <span className="shrink-0 text-[11px] text-destructive">
              Box 上で見つかりません
            </span>
          )}
        </div>

        <span className="mt-0.5 block w-fit max-w-full truncate rounded-full bg-muted px-2 text-[10px] leading-4 text-muted-foreground">
          {item.centerLabel}
        </span>
      </AreaCard>
    </li>
  );
};
