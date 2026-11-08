import {
  abbreviatePath,
  buildBoxDriveUrl,
  buildFullPath,
  buildWebBoxUrl,
} from "./sharedArea";

const item = {
  centerName: "センターD",
  pathNames: ["2024年度", "営業部", "案件A"],
  folderName: "見積資料",
};

describe("sharedArea", () => {
  describe("buildFullPath", () => {
    it("センター名・経路・フォルダ名の順につなぐ", () => {
      expect(buildFullPath(item)).toEqual([
        "センターD",
        "2024年度",
        "営業部",
        "案件A",
        "見積資料",
      ]);
    });

    it("経路が空（センター直下）なら、センター名とフォルダ名だけ", () => {
      expect(
        buildFullPath({ ...item, pathNames: [] }),
      ).toEqual(["センターD", "見積資料"]);
    });
  });

  describe("abbreviatePath", () => {
    it("4 つ以下はそのまま返す", () => {
      expect(abbreviatePath(["a", "b", "c", "d"])).toEqual(["a", "b", "c", "d"]);
    });

    it("5 つ以上は、先頭 1 つと末尾 2 つを残して間を … にする", () => {
      expect(abbreviatePath(["a", "b", "c", "d", "e"])).toEqual([
        "a",
        "…",
        "d",
        "e",
      ]);
    });
  });

  it("buildWebBoxUrl: フォルダ ID で開く", () => {
    expect(buildWebBoxUrl("123")).toBe("https://app.box.com/folder/123");
  });

  it("buildBoxDriveUrl: フルパスを / でつないでエンコードする", () => {
    expect(buildBoxDriveUrl(item)).toBe(
      `/launch/box-drive?path=${encodeURIComponent(
        "センターD/2024年度/営業部/案件A/見積資料",
      )}`,
    );
  });
});
