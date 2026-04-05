import { mockSsCollaborationsDb } from "./ssCollaborationsDb";

describe("mockSsCollaborationsDb", () => {
  it("未登録フォルダでも検証用ダミーのコラボレート一覧を返す", () => {
    const rows = mockSsCollaborationsDb.list("370613768434");

    expect(rows).toHaveLength(20);
    expect(
      rows.filter((row) => row.item?.id === "370613768434"),
    ).toHaveLength(10);
    expect(rows.filter((row) => row.item?.id === "0")).toHaveLength(10);
    expect(
      rows.filter((row) => row.can_view_path === true),
    ).toHaveLength(10);
    expect(
      rows.filter((row) => row.can_view_path === false),
    ).toHaveLength(10);
    expect(rows[0]?.accessible_by?.name).toBe("直下編集ユーザー-8434-1");
    expect(rows[19]?.accessible_by?.name).toBe("継承制限ユーザー-8434-5");
  });
});
