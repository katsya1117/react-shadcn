import type {
  CreateCollaborationsParams,
  GetFolderCollaborationsResponse,
  UpdateCollaborationParams,
} from "../index";

const cloneRows = (rows: GetFolderCollaborationsResponse[]) =>
  rows.map((row) => ({ ...row }));

const buildDummyRows = (
  folderId: string,
): GetFolderCollaborationsResponse[] => {
  const suffix = folderId.slice(-4).padStart(4, "0");
  const rowsPerPattern = 5;
  const buildRows = ({
    prefix,
    role,
    canViewPath,
    type,
    namePrefix,
    itemId,
    itemName,
  }: {
    prefix: string;
    role: "editor" | "viewer";
    canViewPath: boolean;
    type: "user" | "group";
    namePrefix: string;
    itemId: string;
    itemName?: string;
  }) =>
    Array.from({ length: rowsPerPattern }, (_, index) => {
      const serial = `${suffix}-${index + 1}`;

      return {
        id: `${folderId}:${prefix}-${index + 1}`,
        role,
        can_view_path: canViewPath,
        accessible_by: {
          id: `${prefix}-${serial}`,
          type,
          name: `${namePrefix}-${serial}`,
        },
        item: {
          id: itemId,
          type: "folder" as const,
          name: itemName,
        },
      };
    });

  return [
    ...buildRows({
      prefix: "dummy-direct-editor",
      role: "editor",
      canViewPath: true,
      type: "user",
      namePrefix: "直下編集ユーザー",
      itemId: folderId,
    }),
    ...buildRows({
      prefix: "dummy-direct-viewer",
      role: "viewer",
      canViewPath: false,
      type: "group",
      namePrefix: "直下制限部署",
      itemId: folderId,
    }),
    ...buildRows({
      prefix: "dummy-inherited-editor",
      role: "editor",
      canViewPath: true,
      type: "user",
      namePrefix: "継承編集ユーザー",
      itemId: "0",
      itemName: "All Files",
    }),
    ...buildRows({
      prefix: "dummy-inherited-viewer",
      role: "viewer",
      canViewPath: false,
      type: "user",
      namePrefix: "継承制限ユーザー",
      itemId: "0",
      itemName: "All Files",
    }),
  ];
};

const db = new Map<string, GetFolderCollaborationsResponse[]>([
  [
    "0",
    [
      {
        id: "0:ops-admin:direct",
        role: "editor",
        can_view_path: true,
        accessible_by: {
          id: "ops-admin",
          type: "user",
          name: "Ops Admin",
        },
        item: {
          id: "0",
          type: "folder",
          name: "All Files",
        },
      },
      {
        id: "0:tokyo-center:direct",
        role: "viewer",
        can_view_path: false,
        accessible_by: {
          id: "tokyo-center",
          type: "group",
          name: "東京センター",
        },
        item: {
          id: "0",
          type: "folder",
          name: "All Files",
        },
      },
    ],
  ],
  // QMS は少件数パターン確認用
  [
    "370613768434",
    [
      {
        id: "370613768434:qms-direct-editor-1",
        role: "editor",
        can_view_path: true,
        accessible_by: {
          id: "dummy-direct-editor-8434-1",
          type: "user",
          name: "直下編集ユーザー-8434-1",
        },
        item: {
          id: "370613768434",
          type: "folder",
        },
      },
    ],
  ],
]);

const ensureFolderRows = (folderId: string) => {
  const existingRows = db.get(folderId);
  if (existingRows) return existingRows;

  const dummyRows = buildDummyRows(folderId);
  db.set(folderId, dummyRows);
  return dummyRows;
};

const normalizeType = (params: CreateCollaborationsParams) =>
  params.collaboratorType ?? params.type ?? "user";

const normalizeName = (params: CreateCollaborationsParams) =>
  params.collaboratorName ?? params.name ?? "名称未設定";

const normalizeSubjectId = (params: CreateCollaborationsParams) =>
  params.collaboratorId ?? params.id ?? `subject-${Date.now()}`;

const normalizeCanViewPath = (
  params: Pick<CreateCollaborationsParams, "canViewPath" | "can_view_path">,
) => params.canViewPath ?? params.can_view_path ?? true;

const findCollaboration = (collaborationId: string) => {
  for (const [folderId, rows] of db.entries()) {
    const index = rows.findIndex((row) => row.id === collaborationId);
    if (index >= 0) {
      return { folderId, rows, index };
    }
  }

  return null;
};

export const mockSsCollaborationsDb = {
  list(folderId: string) {
    return cloneRows(ensureFolderRows(folderId));
  },

  create(params: CreateCollaborationsParams) {
    const folderId = params.folderId;
    const subjectId = normalizeSubjectId(params);
    const nextRow: GetFolderCollaborationsResponse = {
      id: `${folderId}:${subjectId}`,
      role: params.role,
      can_view_path: normalizeCanViewPath(params),
      accessible_by: {
        id: subjectId,
        type: normalizeType(params) === "department" ? "group" : "user",
        name: normalizeName(params),
      },
      item: {
        id: folderId,
        type: "folder",
      },
    };

    const rows = ensureFolderRows(folderId);
    const nextRows = rows.filter((row) => row.id !== nextRow.id);
    nextRows.push(nextRow);
    db.set(folderId, nextRows);

    return { ...nextRow };
  },

  remove(collaborationId: string) {
    const hit = findCollaboration(collaborationId);
    if (!hit) return false;

    hit.rows.splice(hit.index, 1);
    return true;
  },

  update(collaborationId: string, params: UpdateCollaborationParams) {
    const hit = findCollaboration(collaborationId);
    if (!hit) return null;

    const current = hit.rows[hit.index];
    const updated: GetFolderCollaborationsResponse = {
      ...current,
      role: params.role ?? current.role,
      can_view_path:
        params.canViewPath ?? params.can_view_path ?? current.can_view_path,
    };

    hit.rows[hit.index] = updated;
    return { ...updated };
  },
};
