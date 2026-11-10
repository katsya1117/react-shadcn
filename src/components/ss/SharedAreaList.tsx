import type { SharedAreaItem } from "@/api";
import { Input } from "@/components/ui/input";
import { PATH_SEPARATOR, buildFullPath } from "@/lib/sharedArea";

import { SharedAreaCard } from "./SharedAreaCard";

/** 絞り込み欄を出す件数（これを超えるときだけ） */
export const SHARED_AREA_FILTER_MIN_COUNT = 5;

export const filterSharedAreas = (items: SharedAreaItem[], query: string) => {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return items;
  return items.filter((item) =>
    [item.centerLabel, ...buildFullPath(item)]
      .join(PATH_SEPARATOR)
      .toLowerCase()
      .includes(keyword),
  );
};

/** 共有された領域の絞り込み欄（セクション見出しの右側に置く） */
export const SharedAreaFilter = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <Input
    type="search"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="センター名・フォルダ名・パスで絞り込み"
    aria-label="My Collaboration を絞り込み"
    className="h-8 w-64 shrink-0 rounded-lg border-border/60 bg-card text-xs shadow-xs"
  />
);

/** 共有された領域の一覧。センターでは区分けせず、横長のパネルを縦に積む */
export const SharedAreaList = ({ items }: { items: SharedAreaItem[] }) =>
  items.length === 0 ? (
    <p className="text-sm text-muted-foreground">一致する領域はありません。</p>
  ) : (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <SharedAreaCard key={item.folderId} item={item} />
      ))}
    </ul>
  );
