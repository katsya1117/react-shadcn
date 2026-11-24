import {
  buildPath,
  buildSourcePathByFolderId,
  findDuplicateCollaboration,
  isManageableCollaboration,
  isShareAreaRouteFolderId,
  resolveCollaboratorType,
  toCollaborationListItem,
} from "./ssHelpers";
import type { FolderInfo } from "@/types/ss";
import type { GetFolderCollaborationsResponse } from "@/api";

// SHARE_AREAS の実データを使う（モック不要）。
// shareAreaConfig は副作用なし・定数のみなので実体のまま import される。

// --------------------------------------------------------
// isShareAreaRouteFolderId
// --------------------------------------------------------
describe("isShareAreaRouteFolderId", () => {
  test("SHARE_AREAS に存在する folderId は true", () => {
    expect(isShareAreaRouteFolderId("370613768434")).toBe(true);
  });

  test("存在しない folderId は false", () => {
    expect(isShareAreaRouteFolderId("999999999")).toBe(false);
  });

  test("null は false", () => {
    expect(isShareAreaRouteFolderId(null)).toBe(false);
  });

  test("undefined は false", () => {
    expect(isShareAreaRouteFolderId(undefined)).toBe(false);
  });

  test("空文字は false", () => {
    expect(isShareAreaRouteFolderId("")).toBe(false);
  });
});

// --------------------------------------------------------
// buildPath
// --------------------------------------------------------
describe("buildPath", () => {
  test("id が '0' のとき ROOT のみを返す", () => {
    const folder: FolderInfo = {
      id: "0",
      name: "All Files",
      pathCollection: { entries: [] },
    };
    expect(buildPath(folder)).toEqual({
      fullPath: "\\share\\",
      relativePath: "",
    });
  });

  test("id が空文字のとき ROOT のみを返す", () => {
    const folder: FolderInfo = { id: "", name: "" };
    expect(buildPath(folder)).toEqual({
      fullPath: "\\share\\",
      relativePath: "",
    });
  });

  test("ルート直下のフォルダ（pathCollection にルートのみ）", () => {
    const folder: FolderInfo = {
      id: "100",
      name: "qms",
      pathCollection: { entries: [{ id: "0", name: "All Files" }] },
    };
    const result = buildPath(folder);
    expect(result.fullPath).toBe("\\share\\qms");
    expect(result.relativePath).toBe("qms");
  });

  test("2階層ネストのフォルダ", () => {
    const folder: FolderInfo = {
      id: "200",
      name: "subfolder",
      pathCollection: {
        entries: [
          { id: "0", name: "All Files" },
          { id: "100", name: "qms" },
        ],
      },
    };
    const result = buildPath(folder);
    expect(result.fullPath).toBe("\\share\\qms\\subfolder");
    expect(result.relativePath).toBe("qms\\subfolder");
  });

  test("pathCollection が undefined のとき名前だけで組み立てる", () => {
    const folder: FolderInfo = { id: "100", name: "qms" };
    const result = buildPath(folder);
    expect(result.fullPath).toBe("\\share\\qms");
  });
});

// --------------------------------------------------------
// buildSourcePathByFolderId
// --------------------------------------------------------
describe("buildSourcePathByFolderId", () => {
  test("pathCollection が空のとき、自フォルダ ID だけ登録される", () => {
    const folder: FolderInfo = {
      id: "100",
      name: "qms",
      pathCollection: { entries: [] },
    };
    const map = buildSourcePathByFolderId(folder);
    expect(map["0"]).toBe("\\share\\");
    expect(map["100"]).toBe("\\share\\qms");
  });

  test("2階層: 各中間フォルダに正しいパスが割り当てられる", () => {
    const folder: FolderInfo = {
      id: "200",
      name: "subfolder",
      pathCollection: {
        entries: [
          { id: "0", name: "All Files" },
          { id: "100", name: "qms" },
        ],
      },
    };
    const map = buildSourcePathByFolderId(folder);
    expect(map["100"]).toBe("\\share\\qms");
    expect(map["200"]).toBe("\\share\\qms\\subfolder");
  });

  test("id が '0' のフォルダは pathMap に自身を登録しない", () => {
    const folder: FolderInfo = {
      id: "0",
      name: "All Files",
      pathCollection: { entries: [] },
    };
    const map = buildSourcePathByFolderId(folder);
    // id="0" は DISPLAY_PATH_ROOT として登録されるが、自フォルダ ID としては登録されない
    expect(Object.keys(map)).toEqual(["0"]);
  });
});

// --------------------------------------------------------
// toCollaborationListItem
// --------------------------------------------------------
describe("toCollaborationListItem", () => {
  const currentFolderId = "f1";
  const sourcePathByFolderId: Record<string, string> = {
    f1: "\\share\\qms",
    f0: "\\share\\",
  };

  const makeItem = (
    overrides: Partial<GetFolderCollaborationsResponse> = {},
  ): GetFolderCollaborationsResponse => ({
    id: "collab1",
    role: "viewer",
    accessible_by: { id: "u1", type: "user", name: "Alice" },
    item: { id: currentFolderId, type: "folder" },
    ...overrides,
  });

  test("direct collaboration（同フォルダ）: isInherited=false, canRemove=true", () => {
    const item = makeItem();
    const result = toCollaborationListItem(item, currentFolderId, sourcePathByFolderId);
    expect(result.isInherited).toBe(false);
    expect(result.canRemove).toBe(true);
    expect(result.sourcePath).toBeUndefined();
  });

  test("inherited collaboration（別フォルダ）: isInherited=true, sourcePath が付く", () => {
    const item = makeItem({ item: { id: "f0", type: "folder" } });
    const result = toCollaborationListItem(item, currentFolderId, sourcePathByFolderId);
    expect(result.isInherited).toBe(true);
    expect(result.canRemove).toBe(true);
    expect(result.sourcePath).toBe("\\share\\");
  });

  test("accessible_by.type が group のとき collaborator.type は 'department'", () => {
    const item = makeItem({ accessible_by: { id: "g1", type: "group", name: "Team A" } });
    const result = toCollaborationListItem(item, currentFolderId, sourcePathByFolderId);
    expect(result.collaborator.type).toBe("department");
  });

  test("accessible_by.type が user のとき collaborator.type は 'user'", () => {
    const item = makeItem();
    const result = toCollaborationListItem(item, currentFolderId, sourcePathByFolderId);
    expect(result.collaborator.type).toBe("user");
  });

  test("can_view_path=false のとき canEdit=false → canRemove=false", () => {
    const item = makeItem({ can_view_path: false });
    const result = toCollaborationListItem(item, currentFolderId, sourcePathByFolderId);
    expect(result.collaborator.canEdit).toBe(false);
    expect(result.canRemove).toBe(false);
  });

  test("canViewPath（キャメルケース）も can_view_path の代替として機能する", () => {
    const item = makeItem({ canViewPath: false });
    const result = toCollaborationListItem(item, currentFolderId, sourcePathByFolderId);
    expect(result.collaborator.canEdit).toBe(false);
  });

  test("accessible_by が undefined のとき name は '名称未設定'", () => {
    const item = makeItem({ accessible_by: undefined });
    const result = toCollaborationListItem(item, currentFolderId, sourcePathByFolderId);
    expect(result.collaborator.name).toBe("名称未設定");
  });

  test("item が undefined のとき currentFolderId を sourceFolderId に使う（direct 扱い）", () => {
    const item = makeItem({ item: undefined });
    const result = toCollaborationListItem(item, currentFolderId, sourcePathByFolderId);
    expect(result.isInherited).toBe(false);
    expect(result.collaborator.sourceFolderId).toBe(currentFolderId);
  });
});

// --------------------------------------------------------
// isManageableCollaboration
// --------------------------------------------------------
describe("isManageableCollaboration", () => {
  const row = (extra: Record<string, unknown>) =>
    ({ id: "c1", ...extra }) as unknown as GetFolderCollaborationsResponse;

  test("can_view_path=true は管理対象", () => {
    expect(isManageableCollaboration(row({ can_view_path: true }))).toBe(true);
  });

  test("can_view_path=false は管理対象外", () => {
    expect(isManageableCollaboration(row({ can_view_path: false }))).toBe(false);
  });

  test("canViewPath（キャメルケース）も同じように判定する", () => {
    expect(isManageableCollaboration(row({ canViewPath: false }))).toBe(false);
  });

  test("どちらもなければ管理対象として扱う", () => {
    expect(isManageableCollaboration(row({}))).toBe(true);
  });

  test("両方あるときは can_view_path を優先する", () => {
    expect(
      isManageableCollaboration(row({ can_view_path: true, canViewPath: false })),
    ).toBe(true);
  });
});

// --------------------------------------------------------
// resolveCollaboratorType
// --------------------------------------------------------
describe("resolveCollaboratorType", () => {
  const groups = [{ value: "g1" }, { value: "g2" }];

  test("グループに含まれる ID は department / group", () => {
    expect(resolveCollaboratorType(groups, "g2")).toEqual({
      collaboratorType: "department",
      accessibleByType: "group",
    });
  });

  test("グループに含まれない ID は user / user", () => {
    expect(resolveCollaboratorType(groups, "u1")).toEqual({
      collaboratorType: "user",
      accessibleByType: "user",
    });
  });

  test("グループが空なら user", () => {
    expect(resolveCollaboratorType([], "g1").collaboratorType).toBe("user");
  });
});

// --------------------------------------------------------
// findDuplicateCollaboration
// --------------------------------------------------------
describe("findDuplicateCollaboration", () => {
  const row = (
    id: string,
    type: "user" | "group",
    extra: Record<string, unknown> = {},
  ) =>
    ({
      id: `c-${id}-${type}`,
      accessible_by: { id, type, name: id },
      ...extra,
    }) as unknown as GetFolderCollaborationsResponse;

  test("ID と種別が同じ管理対象の行があれば、その行を返す", () => {
    const rows = [row("u1", "user"), row("u2", "user")];
    expect(findDuplicateCollaboration(rows, "u2", "user")).toBe(rows[1]);
  });

  test("ID が同じでも種別が違えば重複ではない（ユーザー ID とグループ ID が同じ値でも別物）", () => {
    expect(
      findDuplicateCollaboration([row("x1", "group")], "x1", "user"),
    ).toBeUndefined();
  });

  test("can_view_path=false の行は、重複ブロックに使わない", () => {
    expect(
      findDuplicateCollaboration(
        [row("u1", "user", { can_view_path: false })],
        "u1",
        "user",
      ),
    ).toBeUndefined();
  });

  test("accessible_by がない行は無視する", () => {
    expect(
      findDuplicateCollaboration(
        [{ id: "c1" } as unknown as GetFolderCollaborationsResponse],
        "u1",
        "user",
      ),
    ).toBeUndefined();
  });

  test("空配列は重複なし", () => {
    expect(findDuplicateCollaboration([], "u1", "user")).toBeUndefined();
  });
});
