import { mockSsCollaborationsDb } from "./ssCollaborationsDb";

describe("mockSsCollaborationsDb", () => {
  it("未登録フォルダでも検証用ダミーのコラボレート一覧を返す", () => {
    const rows = mockSsCollaborationsDb.list("370613768434");

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.sourceFolderId)).toEqual([
      "370613768434",
      "370613768434",
      "370613768434",
    ]);
    expect(rows.map((row) => row.name)).toEqual([
      "検証ユーザー-8434",
      "検証部署-8434",
      "パス非表示ユーザー-8434",
    ]);
  });
});
