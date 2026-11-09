import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";

import type { SharedAreaItem } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATH_SEPARATOR, buildFullPath } from "@/lib/sharedArea";

import { SharedAreaCard } from "./SharedAreaCard";

/** 絞り込み欄を出す件数（これを超えるときだけ） */
export const SHARED_AREA_FILTER_MIN_COUNT = 5;
/** センターごとに、最初に出すカードの数。超える分は「他 N 件を表示」で広げる */
export const SHARED_AREA_GROUP_COLLAPSED_COUNT = 4;

type Group = {
  centerFolderId: string;
  centerName: string;
  centerLabel: string;
  items: SharedAreaItem[];
};

/** 親のセンターごとにまとめる（一覧は、センター名順に並んでいる前提） */
const groupByCenter = (items: SharedAreaItem[]): Group[] => {
  const groups = new Map<string, Group>();
  for (const item of items) {
    const group = groups.get(item.centerFolderId);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(item.centerFolderId, {
        centerFolderId: item.centerFolderId,
        centerName: item.centerName,
        centerLabel: item.centerLabel,
        items: [item],
      });
    }
  }
  return [...groups.values()];
};

/**
 * 共有された領域の一覧。親のセンターごとに、小見出しをつけてまとめる。
 * センターの区分けは、すべて出す。縦に長くならないよう、センターごとに最初は一部のカードだけ出す。
 * 絞り込み中は、一致するカードをすべて出す（一致のないセンターは出さない）。
 */
export const SharedAreaList = ({ items }: { items: SharedAreaItem[] }) => {
  const [query, setQuery] = useState("");
  const [expandedCenterIds, setExpandedCenterIds] = useState<Set<string>>(
    () => new Set(),
  );

  const keyword = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const filtered = keyword
      ? items.filter((item) =>
          [item.centerLabel, ...buildFullPath(item)]
            .join(PATH_SEPARATOR)
            .toLowerCase()
            .includes(keyword),
        )
      : items;
    return groupByCenter(filtered);
  }, [items, keyword]);

  const toggleExpanded = (centerFolderId: string) =>
    setExpandedCenterIds((prev) => {
      const next = new Set(prev);
      if (next.has(centerFolderId)) next.delete(centerFolderId);
      else next.add(centerFolderId);
      return next;
    });

  return (
    <div className="space-y-5">
      {items.length > SHARED_AREA_FILTER_MIN_COUNT && (
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="センター名・フォルダ名・パスで絞り込み"
          aria-label="共有された領域を絞り込み"
          className="max-w-sm bg-card"
        />
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          一致する領域はありません。
        </p>
      ) : (
        groups.map((group) => {
          const headingId = `shared-center-${group.centerFolderId}`;
          const isExpanded = keyword !== "" || expandedCenterIds.has(group.centerFolderId);
          const visible = isExpanded
            ? group.items
            : group.items.slice(0, SHARED_AREA_GROUP_COLLAPSED_COUNT);
          const hiddenCount = group.items.length - visible.length;
          const canCollapse =
            keyword === "" &&
            group.items.length > SHARED_AREA_GROUP_COLLAPSED_COUNT;

          return (
            <section
              key={group.centerFolderId}
              aria-labelledby={headingId}
              className="space-y-2.5"
            >
              {/* センターごとの小見出し。枠や罫線は付けず、余白でまとまりを作る */}
              <h3
                id={headingId}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Building2
                  className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400"
                  aria-hidden
                />
                <span>{group.centerLabel}</span>
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {group.centerName}
                </span>
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-sky-700 dark:text-sky-400">
                  {group.items.length}
                </span>
              </h3>

              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {visible.map((item) => (
                  <SharedAreaCard key={item.folderId} item={item} />
                ))}
              </ul>

              {canCollapse && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-muted-foreground"
                    onClick={() => toggleExpanded(group.centerFolderId)}
                  >
                    {isExpanded ? "折りたたむ" : `他 ${hiddenCount} 件を表示`}
                  </Button>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
};
