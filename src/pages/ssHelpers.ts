import { DISPLAY_PATH_ROOT } from "@/constants/ssConstants";
import { SHARE_AREAS } from "@/config/shareAreaConfig";
import type { GetFolderCollaborationsResponse } from "@/api";
import type {
  CollaborationListItem,
  CollaboratorType,
  FolderInfo,
} from "@/types/ss";

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
 * 本アプリで管理対象（編集・削除できる）の collaboration かどうか。
 * can_view_path=true のものだけが管理対象。Box UI 由来の can_view_path=false は、一覧には出すが読み取り専用。
 * 表記揺れ（snake_case / camelCase）があり、どちらもなければ true として扱う。
 */
export const isManageableCollaboration = (
  item: GetFolderCollaborationsResponse,
): boolean => item.can_view_path ?? item.canViewPath ?? true;

/**
 * 選択された相手が、グループ（部署）かユーザーかを判定する。
 * collaboratorType は画面側の区分、accessibleByType は Box API 側の区分（department → group）。
 */
export const resolveCollaboratorType = (
  groups: ReadonlyArray<{ value: string }>,
  collaboratorId: string,
): { collaboratorType: CollaboratorType; accessibleByType: "group" | "user" } => {
  const isGroup = groups.some((group) => group.value === collaboratorId);
  return isGroup
    ? { collaboratorType: "department", accessibleByType: "group" }
    : { collaboratorType: "user", accessibleByType: "user" };
};

/**
 * 追加しようとしている相手が、すでに設定済みか。
 * 重複と見なすのは、管理対象（can_view_path=true）の collaboration 同士だけ。
 * Box UI 経由で作られた can_view_path=false は、重複ブロックには使わない。
 */
export const findDuplicateCollaboration = (
  rows: GetFolderCollaborationsResponse[],
  collaboratorId: string,
  accessibleByType: "group" | "user",
): GetFolderCollaborationsResponse | undefined =>
  rows.find(
    (item) =>
      isManageableCollaboration(item) &&
      item.accessible_by?.id === collaboratorId &&
      item.accessible_by?.type === accessibleByType,
  );

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
  const canEdit = isManageableCollaboration(item);

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
