import {
  SHARE_AREAS,
  isShareAreaRouteFolderId,
  stripCurrentFolderIdFromSearch,
} from "./shareAreaConfig";

describe("shareAreaConfig", () => {
  it("ShareArea で公開している boxFolderId だけを routeId として許可する", () => {
    for (const area of SHARE_AREAS) {
      expect(isShareAreaRouteFolderId(area.boxFolderId)).toBe(true);
    }

    expect(isShareAreaRouteFolderId("0")).toBe(false);
    expect(isShareAreaRouteFolderId("999999999999")).toBe(false);
    expect(isShareAreaRouteFolderId(undefined)).toBe(false);
  });

  it("currentFolderId だけを URL から取り除き、それ以外の query は維持する", () => {
    expect(stripCurrentFolderIdFromSearch("?currentFolderId=123")).toBe("");
    expect(
      stripCurrentFolderIdFromSearch("?currentFolderId=123&devToken=test-token"),
    ).toBe("?devToken=test-token");
    expect(stripCurrentFolderIdFromSearch("?devToken=test-token")).toBe(
      "?devToken=test-token",
    );
  });
});
