import { Fragment } from "react";

import type { SharedAreaItem } from "@/api";
import { Badge } from "@/components/ui/badge";
import {
  PATH_SEPARATOR,
  ROLE_LABELS,
  abbreviatePath,
  buildBoxDriveUrl,
  buildFullPath,
  buildWebBoxUrl,
} from "@/lib/sharedArea";

import { AreaCard, BoxLinkButtons } from "./AreaCard";

/**
 * 他センターから共有されたフォルダ 1 つ分の横長パネル。
 * 「センター名 センター表示名 › （途中のパス） › フォルダ名」を 1 行で見せる。
 */
export const SharedAreaCard = ({ item }: { item: SharedAreaItem }) => {
  const isMissing = item.status === "missing";
  const fullPath = buildFullPath(item);
  // 先頭（センター名）と末尾（フォルダ名）は個別に描くので、間だけ取り出す
  const middlePath = abbreviatePath(fullPath).slice(1, -1);

  return (
    <li>
      <AreaCard
        muted={isMissing}
        className="py-1"
        actions={
          <BoxLinkButtons
            webBoxUrl={buildWebBoxUrl(item.folderId)}
            boxDriveUrl={buildBoxDriveUrl(item)}
            disabled={isMissing}
          />
        }
      >
        <div
          className="flex min-w-0 items-center gap-2"
          title={`${item.centerLabel} ${fullPath.join(PATH_SEPARATOR)}`}
        >
          <p className="flex min-w-0 items-baseline gap-1.5 truncate text-sm">
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {item.centerName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.centerLabel}
            </span>
            {middlePath.map((name, i) => (
              <Fragment key={`${name}-${i}`}>
                <span className="shrink-0 text-muted-foreground/60" aria-hidden>
                  ›
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {name}
                </span>
              </Fragment>
            ))}
            <span className="shrink-0 text-muted-foreground/60" aria-hidden>
              ›
            </span>
            <span className="truncate font-mono font-semibold tracking-tight text-foreground">
              {item.folderName}
            </span>
          </p>
          <Badge
            variant="outline"
            className="h-5 shrink-0 px-1.5 text-[10px] font-normal text-muted-foreground"
          >
            {ROLE_LABELS[item.role]}
          </Badge>
          {isMissing && (
            <span className="shrink-0 text-xs text-destructive">
              Box 上で見つかりません
            </span>
          )}
        </div>
      </AreaCard>
    </li>
  );
};
