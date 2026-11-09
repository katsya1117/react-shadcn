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

import { AreaCard, AreaFolderIcon, BoxLinkButtons } from "./AreaCard";

/**
 * 他センターから共有されたフォルダ 1 つ分のカード。
 * 共有されたフォルダへ直接移動するための表示で、コラボレーション設定のボタンは持たない。
 *
 * 所属・ゲストのカードと同じ骨格（アイコン / フォルダ名とバッジ / 下段のボタン）。
 * どのセンターから共有されたかは、カードではなく、センターごとの小見出し（SharedAreaList）で示す。
 * 共有のカードだけがフルパスの行を足す。
 */
export const SharedAreaCard = ({ item }: { item: SharedAreaItem }) => {
  const isMissing = item.status === "missing";
  const fullPath = buildFullPath(item);

  return (
    <li>
      <AreaCard muted={isMissing} tone="sky" className="h-full">
        <div className="flex items-start gap-3">
          <AreaFolderIcon tone="sky" />

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-sm font-semibold tracking-tight text-foreground">
                {item.folderName}
              </span>
              <Badge
                variant="secondary"
                className="h-5 shrink-0 border-0 bg-sky-100/80 px-1.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
              >
                共有
              </Badge>
              <Badge
                variant="outline"
                className="h-5 shrink-0 px-1.5 text-[10px] font-medium"
              >
                {ROLE_LABELS[item.role]}
              </Badge>
            </div>
            {/* フルパス。長いときは途中を省略し、2 行まで折り返す。全文は title で見せる。
                センター直下のときは、小見出しとフォルダ名で分かるので出さない */}
            {item.pathNames.length > 0 && (
              <p
                className="line-clamp-2 break-all text-xs text-muted-foreground/60"
                title={fullPath.join(PATH_SEPARATOR)}
              >
                {abbreviatePath(fullPath).join(PATH_SEPARATOR)}
              </p>
            )}
            {isMissing && (
              <p className="text-xs text-destructive">
                Box 上で見つかりません（削除された、または権限がありません）
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <BoxLinkButtons
            webBoxUrl={buildWebBoxUrl(item.folderId)}
            boxDriveUrl={buildBoxDriveUrl(item)}
            disabled={isMissing}
          />
        </div>
      </AreaCard>
    </li>
  );
};
