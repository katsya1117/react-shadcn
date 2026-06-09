import {
  deriveUserId,
  permLabelMap,
  SearchConditionValMap,
  userIdSchema,
  userUpdateSchema,
} from "./userEditSchema";

// --------------------------------------------------------
// deriveUserId
// --------------------------------------------------------
describe("deriveUserId", () => {
  test("'Y\\' プレフィックスを除去する", () => {
    expect(deriveUserId("Y\\tanaka")).toBe("tanaka");
  });

  test("'Y¥' プレフィックス（全角円記号）を除去する", () => {
    expect(deriveUserId("Y¥tanaka")).toBe("tanaka");
  });

  test("プレフィックスがなければそのまま返す", () => {
    expect(deriveUserId("tanaka")).toBe("tanaka");
  });

  test("空文字はそのまま返す", () => {
    expect(deriveUserId("")).toBe("");
  });
});

// --------------------------------------------------------
// userIdSchema
// --------------------------------------------------------
describe("userIdSchema", () => {
  test("有効なユーザーID は成功", () => {
    expect(userIdSchema.safeParse("tanaka123").success).toBe(true);
  });

  test("空文字はエラー", () => {
    const result = userIdSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("ユーザーIDは必須です");
    }
  });

  test("全角文字を含む場合はエラー", () => {
    const result = userIdSchema.safeParse("tanaka田中");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch("1バイト文字");
    }
  });

  test("記号のみはエラー", () => {
    const result = userIdSchema.safeParse("!@#$");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch("記号だけは不可");
    }
  });

  test("スペースを含む場合はエラー", () => {
    expect(userIdSchema.safeParse("ta naka").success).toBe(false);
  });

  test("前後のスペースはトリムされたうえで判定される（有効な値になる）", () => {
    // zod の .trim() は .refine() より先に評価されるため、"  tanaka  " → "tanaka" として成功する
    expect(userIdSchema.safeParse("  tanaka  ").success).toBe(true);
  });
});

// --------------------------------------------------------
// userUpdateSchema
// --------------------------------------------------------
describe("userUpdateSchema", () => {
  const valid = {
    dispName: "田中一郎",
    account: "Y\\tanaka",
    mail: "tanaka@example.com",
  };

  test("有効な入力は成功し、前後スペースがトリムされる", () => {
    const result = userUpdateSchema.safeParse({
      dispName: "  田中一郎  ",
      account: " Y\\tanaka ",
      mail: " tanaka@example.com ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dispName).toBe("田中一郎");
      expect(result.data.account).toBe("Y\\tanaka");
      expect(result.data.mail).toBe("tanaka@example.com");
    }
  });

  test("表示名が空はエラー", () => {
    const result = userUpdateSchema.safeParse({ ...valid, dispName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch("表示名は必須");
    }
  });

  test("表示名が記号のみはエラー", () => {
    const result = userUpdateSchema.safeParse({ ...valid, dispName: "---" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch("記号だけは不可");
    }
  });

  test("メールアドレスが不正な形式はエラー", () => {
    const result = userUpdateSchema.safeParse({ ...valid, mail: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("形式が不正"))).toBe(true);
    }
  });

  test("メールアドレスが全角文字を含むとエラー", () => {
    const result = userUpdateSchema.safeParse({ ...valid, mail: "ｔanaka@example.com" });
    expect(result.success).toBe(false);
  });

  test("アカウント名が空はエラー", () => {
    const result = userUpdateSchema.safeParse({ ...valid, account: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch("ユーザー名は必須");
    }
  });
});

// --------------------------------------------------------
// permLabelMap
// --------------------------------------------------------
describe("permLabelMap", () => {
  test("定義されているキーすべてにラベルが存在する", () => {
    const keys = Object.keys(permLabelMap) as (keyof typeof permLabelMap)[];
    expect(keys.length).toBeGreaterThan(0);
    keys.forEach((key) => {
      expect(permLabelMap[key]).toBeTruthy();
    });
  });

  test("既知のキーが正しいラベルにマップされる", () => {
    expect(permLabelMap.can_job_create).toBe("ジョブ作成");
    expect(permLabelMap.can_manage).toBe("管理メニュー");
  });
});

// --------------------------------------------------------
// SearchConditionValMap
// --------------------------------------------------------
describe("SearchConditionValMap", () => {
  test("1〜7 のすべてのキーに値が存在する", () => {
    ([1, 2, 3, 4, 5, 6, 7] as const).forEach((cd) => {
      expect(SearchConditionValMap[cd]).toBeTruthy();
    });
  });

  test("既知のキーが正しい値にマップされる", () => {
    expect(SearchConditionValMap[1]).toBe("6ヶ月経過JOB");
    expect(SearchConditionValMap[7]).toBe("削除フラグJOB");
  });
});
