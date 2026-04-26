import type { BoxFolder } from "@/types/BoxUiElements";

export type ContentExplorerInstance = {
  show: (folderId: string, token: string, opts: unknown) => void;
  hide?: () => void;
  removeAllListeners?: () => void;
  addListener?: (
    event: "navigate",
    callback: (item: BoxFolder) => void,
  ) => void;
  navigateTo?: (folderId: string) => void;
};

export type RoleType = "editor" | "viewer";
export type CollaboratorType = "user" | "department";

export type Collaborator = {
  id: string;
  type: CollaboratorType;
  name: string;
  role: RoleType;
  canEdit: boolean;
  // Box API item.id: そのコラボレートが設定されているフォルダID
  sourceFolderId: string;
};

export type CollaborationState = {
  direct: Collaborator[];
};

export type FolderInfo = {
  id: string;
  name: string;
  pathCollection?: { entries: { id: string; name: string }[] };
};

export type CollaborationListItem = {
  collaborator: Collaborator;
  isInherited: boolean;
  canRemove: boolean;
  sourcePath?: string;
};
