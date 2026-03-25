import type {
  CreateCollaborationsParams,
  GetFolderCollaborationsResponse,
  UpdateCollaborationParams,
} from "../index";

const db = new Map<string, GetFolderCollaborationsResponse[]>([
  [
    "0",
    [
      {
        id: "0:ops-admin",
        type: "user",
        name: "Ops Admin",
        role: "editor",
        canViewPath: true,
        sourceFolderId: "0",
      },
      {
        id: "0:tokyo-center",
        type: "department",
        name: "東京センター",
        role: "viewer",
        canViewPath: false,
        sourceFolderId: "0",
      },
    ],
  ],
]);

const cloneRows = (rows: GetFolderCollaborationsResponse[]) =>
  rows.map((row) => ({ ...row }));

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
    return cloneRows(db.get(folderId) ?? []);
  },

  create(params: CreateCollaborationsParams) {
    const folderId = params.folderId;
    const subjectId = normalizeSubjectId(params);
    const nextRow: GetFolderCollaborationsResponse = {
      id: `${folderId}:${subjectId}`,
      type: normalizeType(params),
      name: normalizeName(params),
      role: params.role,
      canViewPath: normalizeCanViewPath(params),
      sourceFolderId: folderId,
    };

    const rows = db.get(folderId) ?? [];
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
      canViewPath:
        params.canViewPath ?? params.can_view_path ?? current.canViewPath,
    };

    hit.rows[hit.index] = updated;
    return { ...updated };
  },
};
