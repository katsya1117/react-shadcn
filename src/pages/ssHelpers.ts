import { DISPLAY_PATH_ROOT } from "@/constants/ssConstants";
import { SHARE_AREAS } from "@/config/shareAreaConfig";
import type { GetFolderCollaborationsResponse } from "@/api";
import type { CollaborationListItem, FolderInfo } from "@/types/ss";

const SHARE_AREA_ROUTE_FOLDER_ID_SET = new Set(
  SHARE_AREAS.map((area) => area.boxFolderId),
);

export const isShareAreaRouteFolderId = (
  folderId: string | null | undefined,
): folderId is string =>
  typeof folderId === "string" && SHARE_AREA_ROUTE_FOLDER_ID_SET.has(folderId);

/**
 * 現在フォルダのパス（フル / 相対）を組み立てる。
 * Box の path_collection からルート（id="0"）を除いて UNC 風に連結する。
 */
export const buildPath = (folder: FolderInfo) => {
  if (!folder.id || folder.id === "0") {
    return { fullPath: DISPLAY_PATH_ROOT, relativePath: "" };
  }
  const entries = folder.pathCollection?.entries ?? [];
  const filteredEntries = entries.filter((entry) => entry.id !== "0");
  const segments = [
    ...filteredEntries.map((entry) => entry.name),
    folder.name,
  ].filter(Boolean);
  const fullPath = `${DISPLAY_PATH_ROOT}${segments.join("\\")}`;
  const relativePath = fullPath.slice(DISPLAY_PATH_ROOT.length);
  return { fullPath, relativePath };
};

/**
 * 継承元フォルダ ID から、その絶対パス文字列を引くためのマップを作る。
 * inherited collaboration の表示で「どのフォルダから継承されているか」を出すのに使う。
 */
export const buildSourcePathByFolderId = (
  currentFolder: FolderInfo,
): Record<string, string> => {
  const entries =
    currentFolder.pathCollection?.entries.filter((e) => e.id !== "0") ?? [];
  const pathMap: Record<string, string> = {};
  let currentPath = DISPLAY_PATH_ROOT.replace(/\\$/, "");
  pathMap["0"] = DISPLAY_PATH_ROOT;
  for (const entry of entries) {
    currentPath += `\\${entry.name}`;
    pathMap[entry.id] = currentPath;
  }
  if (currentFolder.id && currentFolder.id !== "0") {
    pathMap[currentFolder.id] = `${currentPath}\\${currentFolder.name}`;
  }
  return pathMap;
};

/**
 * Box API のレスポンス1件を画面表示用に正規化する純粋関数。
 * - direct/inherited の判定
 * - can_view_path の表記揺れ対応
 * - sourcePath（継承元のパス）の付与
 */
export const toCollaborationListItem = (
  item: GetFolderCollaborationsResponse,
  currentFolderId: string,
  sourcePathByFolderId: Record<string, string>,
): CollaborationListItem => {
  const sourceFolderId = item.item?.id ?? currentFolderId;
  const isInherited = sourceFolderId !== currentFolderId;
  // 本アプリでは can_view_path=true の collaboration だけを管理対象として扱う。
  // Box UI 由来の can_view_path=false は一覧には出すが読み取り専用。
  const canEdit = item.can_view_path ?? item.canViewPath ?? true;

  return {
    collaborator: {
      id: item.id,
      type: item.accessible_by?.type === "group" ? "department" : "user",
      name: item.accessible_by?.name ?? "名称未設定",
      role: item.role,
      canEdit,
      sourceFolderId,
    },
    isInherited,
    canRemove: canEdit,
    sourcePath: isInherited ? sourcePathByFolderId[sourceFolderId] : undefined,
  };
};
