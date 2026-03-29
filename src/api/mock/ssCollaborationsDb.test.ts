import { mockSsCollaborationsDb } from "./ssCollaborationsDb";

describe("mockSsCollaborationsDb", () => {
  it("未登録フォルダでも検証用ダミーのコラボレート一覧を返す", () => {
    const rows = mockSsCollaborationsDb.list("370613768434");

    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.item?.id)).toEqual([
      "370613768434",
      "370613768434",
      "0",
      "0",
    ]);
    expect(rows.map((row) => row.accessible_by?.name)).toEqual([
      "直下編集ユーザー-8434",
      "直下制限部署-8434",
      "継承編集ユーザー-8434",
      "継承制限ユーザー-8434",
    ]);
  });
});
