import type { SharedAreaItem, SharedAreaRole } from "@/api";

/** フルパスの区切り表示 */
export const PATH_SEPARATOR = " › ";

/** 省略の記号 */
const ELLIPSIS = "…";

/** センターから、共有されたフォルダ自身までの名前の並び（DB の値から組み立てる） */
export const buildFullPath = (
  item: Pick<SharedAreaItem, "centerName" | "pathNames" | "folderName">,
): string[] => [item.centerName, ...item.pathNames, item.folderName];

/**
 * 長いパスを省略する。先頭の 1 つ（センター名）と末尾の 2 つを残して、間を … にする。
 * 省略しても短くならない（4 つ以下）ときは、そのまま返す。
 */
export const abbreviatePath = (parts: string[]): string[] =>
  parts.length <= 4
    ? parts
    : [parts[0], ELLIPSIS, ...parts.slice(-2)];

/** Web Box（ブラウザ）で開く URL。ID で開くので、改名の影響を受けない */
export const buildWebBoxUrl = (folderId: string) =>
  `https://app.box.com/folder/${folderId}`;

/**
 * Box Drive で開くための URL。DB に保存した経路から作る（Box には問い合わせない）。
 * 起動の仕組み（jclUrl 相当）が共有されたフォルダでどう動くかは未決のため、仮の形にしている。
 */
export const buildBoxDriveUrl = (
  item: Pick<SharedAreaItem, "centerName" | "pathNames" | "folderName">,
) => `/launch/box-drive?path=${encodeURIComponent(buildFullPath(item).join("/"))}`;

export const ROLE_LABELS: Record<SharedAreaRole, string> = {
  editor: "編集者",
  viewer: "閲覧者",
};
