import {
  buildPath,
  buildSourcePathByFolderId,
  isShareAreaRouteFolderId,
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
