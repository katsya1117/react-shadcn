import { useMemo, useState } from "react";

import type { SharedAreaItem } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATH_SEPARATOR, buildFullPath } from "@/lib/sharedArea";

import { SharedAreaCard } from "./SharedAreaCard";

/** 最初に出す件数。これを超えるときだけ、「すべて表示」と絞り込みを出す */
export const SHARED_AREA_COLLAPSED_COUNT = 5;

/**
 * 共有された領域の一覧。縦に長くならないよう、最初は一部だけ出す。
 * 絞り込み中は、一致するものをすべて出す。
 */
export const SharedAreaList = ({ items }: { items: SharedAreaItem[] }) => {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const needsControls = items.length > SHARED_AREA_COLLAPSED_COUNT;
  const keyword = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      keyword
        ? items.filter((item) =>
            buildFullPath(item).join(PATH_SEPARATOR).toLowerCase().includes(keyword),
          )
        : items,
    [items, keyword],
  );

  const showAll = expanded || keyword !== "";
  const visible =
    needsControls && !showAll
      ? filtered.slice(0, SHARED_AREA_COLLAPSED_COUNT)
      : filtered;
  const hiddenCount = filtered.length - visible.length;

  return (
    <div className="space-y-3">
      {needsControls && (
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="センター名・フォルダ名・パスで絞り込み"
          aria-label="共有された領域を絞り込み"
          className="max-w-sm"
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          一致する領域はありません。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((item) => (
            <SharedAreaCard key={item.folderId} item={item} />
          ))}
        </ul>
      )}

      {needsControls && keyword === "" && (hiddenCount > 0 || expanded) && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "折りたたむ" : `すべて表示（あと ${hiddenCount} 件）`}
          </Button>
        </div>
      )}
    </div>
  );
};
