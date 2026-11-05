import {
  BOX_DEV_TOKEN_STORAGE_KEY,
  configureBoxDevToken,
  getBoxDevToken,
  normalizeBoxToken,
} from "./boxDevToken";

describe("boxDevToken", () => {
  afterEach(() => {
    localStorage.removeItem(BOX_DEV_TOKEN_STORAGE_KEY);
    configureBoxDevToken({ enabled: false });
  });

  it("既定（無効）では、localStorage にトークンがあっても返さない", () => {
    localStorage.setItem(BOX_DEV_TOKEN_STORAGE_KEY, "stored");

    expect(getBoxDevToken()).toBeUndefined();
  });

  it("無効のときは、環境変数のトークンも返さない", () => {
    configureBoxDevToken({ enabled: false, envToken: "from-env" });

    expect(getBoxDevToken()).toBeUndefined();
  });

  it("有効で、トークンがどこにもなければ undefined", () => {
    configureBoxDevToken({ enabled: true });

    expect(getBoxDevToken()).toBeUndefined();
  });

  it("有効なとき、localStorage のトークンを返す", () => {
    configureBoxDevToken({ enabled: true });
    localStorage.setItem(BOX_DEV_TOKEN_STORAGE_KEY, "stored");

    expect(getBoxDevToken()).toBe("stored");
  });

  it("有効なとき、環境変数のトークンを返す", () => {
    configureBoxDevToken({ enabled: true, envToken: "from-env" });

    expect(getBoxDevToken()).toBe("from-env");
  });

  it("localStorage が環境変数より優先される（再読み込みだけで差し替えられる）", () => {
    configureBoxDevToken({ enabled: true, envToken: "from-env" });
    localStorage.setItem(BOX_DEV_TOKEN_STORAGE_KEY, "stored");

    expect(getBoxDevToken()).toBe("stored");
  });

  it("前後の空白は取り除く。空文字・空白のみは、トークンなしとして扱う", () => {
    configureBoxDevToken({ enabled: true, envToken: "  from-env  " });
    expect(getBoxDevToken()).toBe("from-env");

    localStorage.setItem(BOX_DEV_TOKEN_STORAGE_KEY, "   ");
    expect(getBoxDevToken()).toBe("from-env");

    localStorage.setItem(BOX_DEV_TOKEN_STORAGE_KEY, "  stored  ");
    expect(getBoxDevToken()).toBe("stored");

    configureBoxDevToken({ enabled: true, envToken: "   " });
    localStorage.removeItem(BOX_DEV_TOKEN_STORAGE_KEY);
    expect(getBoxDevToken()).toBeUndefined();
  });
});

describe("normalizeBoxToken", () => {
  it.each([
    ["abc123", "abc123"],
    ["  abc123  ", "abc123"],
    ['"abc123"', "abc123"],
    ["'abc123'", "abc123"],
    ["`abc123`", "abc123"],
    ["Bearer abc123", "abc123"],
    ["bearer   abc123", "abc123"],
    ['"Bearer abc123"', "abc123"],
    ['  "  Bearer abc123  "  ', "abc123"],
  ])("%j → %j", (raw, expected) => {
    expect(normalizeBoxToken(raw)).toBe(expected);
  });

  it.each([[""], ["   "], ['""'], ["Bearer "], [null], [undefined]])(
    "%j はトークンなし",
    (raw) => {
      expect(normalizeBoxToken(raw as string | null | undefined)).toBeUndefined();
    },
  );

  it("トークンの途中にある引用符や Bearer は取り除かない", () => {
    expect(normalizeBoxToken("ab'c")).toBe("ab'c");
    expect(normalizeBoxToken("abBearer c")).toBe("abBearer c");
  });
});

describe("getBoxDevToken の貼り付けミスの吸収", () => {
  afterEach(() => {
    localStorage.removeItem(BOX_DEV_TOKEN_STORAGE_KEY);
    configureBoxDevToken({ enabled: false });
  });

  it("localStorage に Bearer 付き・引用符付きで入れても、トークン本体だけを返す", () => {
    configureBoxDevToken({ enabled: true });
    localStorage.setItem(BOX_DEV_TOKEN_STORAGE_KEY, '"Bearer abc123"');

    expect(getBoxDevToken()).toBe("abc123");
  });

  it("環境変数も同様に正規化する", () => {
    configureBoxDevToken({ enabled: true, envToken: "Bearer from-env" });

    expect(getBoxDevToken()).toBe("from-env");
  });
});
