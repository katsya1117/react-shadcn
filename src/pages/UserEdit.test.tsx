import { jest } from "@jest/globals";
import { toast } from "@/components/ui/sonner";
import { getPermissionList, permissionReducer } from "@/redux/slices/permissionSlice";
import {
  getUserInfo,
  removeUser,
  updateUserInfo,
  userSliceReducer,
} from "@/redux/slices/userSlice";
import { autoCompleteReducer } from "@/redux/slices/autoCompleteSlice";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { UserEdit } from "./UserEdit";

// =============================================================================
// このファイルの非同期テストの読み方（詳細は test/README.md「7. 非同期テスト」）
//
// 非同期テストは必ず「① 準備 → ② 操作 → ③ 待つ」の3層に分解できる。
//   ① 準備 : API / thunk を「成功 or 失敗する Promise」に差し替える（本物は呼ばない）
//   ② 操作 : await user.click(...) … クリックによる再描画が終わるまで待つ
//   ③ 待つ : await waitFor(() => expect(...)) … expect が通るまでリトライして待つ
//            （toast や画面更新は Promise 解決後＝「未来」に起きるので、待たないと必ず失敗する）
//
// ★ このファイル特有のイディオム（RTK thunk の戻り値を偽装する）:
//
//   dispatchSpy.mockImplementation((action) => {
//     if (action?.type === "updateUserInfo") {
//       return Object.assign(Promise.resolve(result), {
//         unwrap: () => Promise.resolve(payload),   // ← 成功を偽装
//         // unwrap: () => Promise.reject(err),      // ← 失敗を偽装
//       });
//     }
//     return Promise.resolve(action);               // それ以外の action は素通し
//   });
//
//   理由: コンポーネント側は `await dispatch(updateUserInfo(...)).unwrap()` と書く。
//         RTK の thunk は「Promise であり、かつ .unwrap() を持つオブジェクト」を返す。
//         それを Object.assign(Promise, { unwrap }) で再現している。
//         .unwrap() が resolve すれば成功フロー、reject すれば catch（失敗）フローに入る。
// =============================================================================

// このテストでモックする依存（実体は src/**/__mocks__ の共有モック）。
jest.mock("@/components/ui/select");
jest.mock("@/components/ui/radio-group");
jest.mock("@/components/ui/sonner");
jest.mock("@/components/common/AutoComplete/AutoCompleteSingle");
jest.mock("@/components/common/Confirm/ConfirmButton");
jest.mock("@/components/common/LoadingOverlay");
jest.mock("@/redux/slices/userSlice");
jest.mock("@/redux/slices/permissionSlice");

// ----- helpers ----- //
const buildUserState = (
  overrides: Partial<ReturnType<typeof userSliceReducer>> = {},
) => {
  const base = userSliceReducer(undefined, { type: "@@INIT" });
  return { ...base, ...overrides };
};

const makeStore = (overrides: {
  user?: Partial<ReturnType<typeof userSliceReducer>>;
  permissionList?: any;
  groups?: any[];
} = {}) =>
  setupWithStore(<UserEdit />, {
    reducers: {
      user: userSliceReducer,
      permission: permissionReducer,
      autoComplete: autoCompleteReducer,
    } as any,
    preloadedState: {
      user: buildUserState(overrides.user ?? {}) as any,
      permission: { permissionList: overrides.permissionList ?? null } as any,
      autoComplete: {
        isLoading: false,
        error: { code: 0, message: "" },
        users: [],
        groups: overrides.groups ?? [],
      } as any,
    },
  });

// ----- tests ----- //
describe("UserEdit", () => {
  beforeEach(() => {
    (globalThis as any).mockParams = { user_cd: "u123" };
  });

  afterEach(() => {
    jest.clearAllMocks();
    (globalThis as any).mockParams = {};
  });

  it("初期表示で getUserInfo と getPermissionList を dispatch する", async () => {
    const { dispatchSpy } = makeStore();

    await waitFor(() => {
      expect(getUserInfo).toHaveBeenCalledWith("u123");
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "getUserInfo" }),
      );
      expect(getPermissionList).toHaveBeenCalled();
    });
  });

  it("バリデーションエラーで保存せず toast.error を出す", async () => {
    const { user } = makeStore();

    const inputs = screen.getAllByRole("textbox");
    // 0: user_cd (readonly), 1: 表示名, 2: アカウント, 3: メール
    // fireEvent.change を使って高速に 101 文字を入力（userEvent.type は1文字ずつで遅い）
    fireEvent.change(inputs[1], { target: { value: "a".repeat(101) } });

    // ② 操作
    await user.click(screen.getByText("保存"));

    // ③ 検証: バリデーションは zod による「同期処理」。API を呼ぶ前に toast.error が出る。
    //    → Promise を待つ必要がないので waitFor 不要で直接 expect できる。
    //    （API 失敗の検証だけが waitFor を要する。ここで使い分けに注目）
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("表示名の文字数制限"),
    );
    expect(updateUserInfo).not.toHaveBeenCalled();
  });

  it("保存成功で updateUserInfo を dispatch し toast.success を出す", async () => {
    const permissionList = [
      {
        perm_cd: "perm1",
        perm_name: "権限1",
        search_cd1: 1,
        search_cd2: 2,
        search_cd3: 3,
        can_job_create: 1,
        can_status_import: 0,
        can_access_authority: 0,
        can_status_change: 1,
        can_job_change_expiry: 0,
        can_job_change: 0,
        can_status_reissue: 0,
        can_job_arrow_user: 0,
        can_log_search: 1,
        can_manage: 1,
        can_ng_word: 0,
        can_auto_delete: 0,
      },
    ];

    // Set desired values directly in preloaded state — useEffect populates the form from this
    const target = {
      user: {
        user_cd: "u123",
        user_name: "New Name",
        user_account: "newacc",
        email: "new@example.com",
        perm_cd: "perm1",
        language_code: 0,
      },
      center: [{ center_cd: "c1", belonging_flg: 0 }],
    };

    const { user, dispatchSpy } = makeStore({
      user: {
        adList: { searchCondition: undefined, data: target as any },
        isLoading: false,
      },
      permissionList,
      groups: [{ value: "c1", label: "c1" }],
    });

    // ── ① 準備: dispatch を乗っ取り、updateUserInfo を「成功する thunk」に偽装する ──
    //    .unwrap() が resolve するので、コンポーネントは成功フロー（toast.success）へ進む。
    const updateResult = { type: "user/updateUserInfo/fulfilled", payload: {} };
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "getUserInfo") {
        return Promise.resolve({});
      }
      if (action?.type === "updateUserInfo") {
        return Object.assign(Promise.resolve(updateResult), {
          unwrap: () => Promise.resolve(updateResult.payload), // 成功を偽装
        });
      }
      return Promise.resolve(action);
    }) as any);

    // ── ② 操作: 保存ボタンを押す（クリックによる再描画の完了まで await）──
    await user.click(screen.getByText("保存"));

    // ── ③ 待つ: dispatch 後、Promise 解決 → toast.success が呼ばれるまでリトライ待ち ──
    await waitFor(() => {
      expect(updateUserInfo).toHaveBeenCalledWith({
        userCd: "u123",
        params: expect.objectContaining({
          disp_name: "New Name",
          account: "newacc",
          email: "new@example.com",
          center_cd: "c1",
          perm_cd: "perm1",
          language_code: 0,
        }),
      });
      expect(toast.success).toHaveBeenCalledWith("保存しました");
    });
  });

  it("削除成功後はユーザー検索へ戻し、遷移先でtoastを出すstateを渡す", async () => {
    const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;
    const { user, dispatchSpy } = makeStore();

    // ① 準備: removeUser を「成功する thunk」に偽装（.unwrap() が resolve）
    const removeResult = { type: "user/removeUser/fulfilled", payload: true };
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "removeUser") {
        return Object.assign(Promise.resolve(removeResult), {
          unwrap: () => Promise.resolve(removeResult.payload),
        });
      }
      return Promise.resolve(action);
    }) as any);

    // ② 操作
    await user.click(screen.getByText("削除する"));

    // ③ 検証: 削除成功時は「その場で toast を出さず」遷移先に state を渡して navigate する仕様。
    //    （遷移先の一覧画面が deletedUserCd を見て toast を出す。ここでは navigate 引数を確認）
    //    ※ navigate は同期的に呼ばれるため、ここは waitFor 不要で直接 expect できる。
    expect(removeUser).toHaveBeenCalledWith("u123");
    expect(toast.success).not.toHaveBeenCalledWith(
      expect.stringContaining("削除"),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/manage/User", {
      replace: true,
      state: { deletedUserCd: "u123" },
    });
  });

  it("isLoading=true のとき FormSkeleton を表示する", () => {
    makeStore({ user: { isLoading: true } });
    // Skeleton の存在を確認（フォームフィールドは非表示）
    expect(screen.queryByLabelText("表示名")).not.toBeInTheDocument();
  });

  it("アカウント名入力で account state が更新される", async () => {
    const { user } = makeStore();
    const inputs = screen.getAllByRole("textbox");
    // 0: user_cd (readonly), 1: 表示名, 2: アカウント名, 3: メール
    await user.clear(inputs[2]);
    await user.type(inputs[2], "newaccount");
    expect((inputs[2] as HTMLInputElement).value).toBe("newaccount");
  });

  it("メールアドレス入力で mail state が更新される", async () => {
    const { user } = makeStore();
    const inputs = screen.getAllByRole("textbox");
    await user.clear(inputs[3]);
    await user.type(inputs[3], "new@example.com");
    expect((inputs[3] as HTMLInputElement).value).toBe("new@example.com");
  });

  it("所属センター変更で belonging state が更新される", async () => {
    const { user } = makeStore();
    const select = screen.getByTestId("auto-complete-single") as HTMLSelectElement;
    await user.selectOptions(select, "c1");
    expect(select.value).toBe("c1");
  });

  it("言語ラジオ変更で lang state が更新される", async () => {
    const { user } = makeStore();
    const radioGroup = screen.getByTestId("radio-group");
    const enRadio = radioGroup.querySelector('input[value="en"]') as HTMLInputElement;
    await user.click(enRadio);
    expect(enRadio.checked).toBe(true);
  });

  it("権限セレクト変更で permission state が更新される", async () => {
    const permissionList = [
      {
        perm_cd: "perm1",
        perm_name: "権限1",
        search_cd1: 1,
        search_cd2: 2,
        search_cd3: 3,
        can_job_create: 1,
        can_status_import: 0,
        can_access_authority: 0,
        can_status_change: 1,
        can_job_change_expiry: 0,
        can_job_change: 0,
        can_status_reissue: 0,
        can_job_arrow_user: 0,
        can_log_search: 1,
        can_manage: 1,
        can_ng_word: 0,
        can_auto_delete: 0,
      },
    ];
    const { user } = makeStore({ permissionList });
    const select = screen.getByTestId("select") as HTMLSelectElement;
    await user.selectOptions(select, "perm1");
    // activePerm が表示される
    expect(screen.getByText("権限内容")).toBeInTheDocument();
  });

  it("account が記号のみ（Y\\接頭辞剥ぎ後）のとき userId バリデーションエラー", async () => {
    const { user } = makeStore();
    const inputs = screen.getAllByRole("textbox");
    // dispName を有効な値に、account を Y\+記号のみに設定
    await user.clear(inputs[1]);
    await user.type(inputs[1], "Valid Name");
    await user.clear(inputs[2]);
    await user.type(inputs[2], "Y\\---"); // Y\を剥ぐと "---" になり英数字なし
    await user.clear(inputs[3]);
    await user.type(inputs[3], "valid@example.com");

    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("ユーザーID"),
      );
    });
    expect(updateUserInfo).not.toHaveBeenCalled();
  });

  it("保存失敗（文字列エラー）で toast.error にそのまま渡す", async () => {
    const { user, dispatchSpy } = makeStore();
    const inputs = screen.getAllByRole("textbox");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "Valid Name");
    await user.clear(inputs[2]);
    await user.type(inputs[2], "validacc");
    await user.clear(inputs[3]);
    await user.type(inputs[3], "valid@example.com");

    // ① 準備: updateUserInfo を「失敗する thunk」に偽装。
    //    .unwrap() が reject('権限エラーです') → コンポーネントの catch に入る。
    //    catch では `typeof error === "string"` なら文字列をそのまま toast.error に渡す。
    const errMsg = "権限エラーです";
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "updateUserInfo") {
        return Object.assign(Promise.resolve({}), {
          unwrap: () => Promise.reject(errMsg), // 失敗を偽装（文字列を reject）
        });
      }
      return Promise.resolve(action);
    }) as any);

    // ② 操作
    await user.click(screen.getByText("保存"));

    // ③ 待つ: reject → catch → toast.error("権限エラーです") が呼ばれるまで待つ
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errMsg);
    });
  });

  it("削除失敗で toast.error を出す", async () => {
    const { user, dispatchSpy } = makeStore();

    // ① 準備: removeUser を「Error で reject する thunk」に偽装（→ catch 経路）
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "removeUser") {
        return Object.assign(Promise.resolve({}), {
          unwrap: () => Promise.reject(new Error("削除失敗")),
        });
      }
      return Promise.resolve(action);
    }) as any);

    await user.click(screen.getByText("削除する")); // ② 操作

    // ③ 待つ: Error は文字列でないので固定メッセージ "削除に失敗しました" になる
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("削除に失敗しました");
    });
  });

  it("検索条件リセット成功で toast.success を出す", async () => {
    // リセットは thunk ではなく SearchSetApi を直接呼ぶ。
    // 共有モック（__mocks__）の clearSearchSet は既定で成功を返すので、ここでは偽装不要。
    const { user } = makeStore();
    await user.click(screen.getByText("リセット")); // ② 操作
    await waitFor(() => {                            // ③ 待つ
      expect(toast.success).toHaveBeenCalledWith("検索条件をリセットしました");
    });
  });

  it("検索条件リセット: API が data=null を返すとき toast.error を出す", async () => {
    // ① 準備: API メソッドを直接 spyOn して「data=null を返す Promise」に差し替える。
    //    mockResolvedValueOnce の "Once" = 次の1回だけこの値を返し、以降は元の挙動に戻る。
    const { SearchSetApi } = await import("@/api");
    const spy = jest.spyOn(SearchSetApi.prototype, "clearSearchSet")
      .mockResolvedValueOnce({ data: null } as any);

    const { user } = makeStore();
    await user.click(screen.getByText("リセット")); // ② 操作

    // ③ 待つ: data が null → コンポーネントが「レスポンス不正」と判断し toast.error を出すまで
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "検索条件のリセットに失敗しました",
        expect.objectContaining({ description: "レスポンスが不正です" }),
      );
    });
    spy.mockRestore(); // 後片付け: spyOn で差し替えた実装を元に戻す
  });

  it("検索条件リセット: API が Error をスローするとき そのメッセージを toast.error に渡す", async () => {
    // ① 準備: clearSearchSet を「Error を reject する Promise」に差し替える。
    //    mockRejectedValueOnce = 次の1回だけ reject する。
    const { SearchSetApi } = await import("@/api");
    const spy = jest.spyOn(SearchSetApi.prototype, "clearSearchSet")
      .mockRejectedValueOnce(new Error("APIタイムアウト"));

    const { user } = makeStore();
    await user.click(screen.getByText("リセット")); // ② 操作

    // ③ 待つ: reject(Error) → catch で e.message を取り出し description に渡すまで
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "検索条件のリセットに失敗しました",
        expect.objectContaining({ description: "APIタイムアウト" }),
      );
    });
    spy.mockRestore();
  });

  it("検索条件リセット: 非 Error がスローされたとき '不明なエラー' を渡す", async () => {
    // ① 準備: Error ではなく「ただの文字列」を reject させ、catch の else 分岐を通す。
    //    （e instanceof Error が false → description は "不明なエラー" になる）
    const { SearchSetApi } = await import("@/api");
    const spy = jest.spyOn(SearchSetApi.prototype, "clearSearchSet")
      .mockRejectedValueOnce("文字列エラー");

    const { user } = makeStore();
    await user.click(screen.getByText("リセット")); // ② 操作

    // ③ 待つ
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "検索条件のリセットに失敗しました",
        expect.objectContaining({ description: "不明なエラー" }),
      );
    });
    spy.mockRestore();
  });

  it("言語ラジオ: ja クリックで setLang('ja') が呼ばれる（'en' への変換はしない）", async () => {
    const { user } = makeStore();
    const radioGroup = screen.getByTestId("radio-group");
    const jaRadio = radioGroup.querySelector('input[value="ja"]') as HTMLInputElement;
    await user.click(jaRadio);
    expect(jaRadio.checked).toBe(true);
  });

  it("adList.data から言語設定が 'undefined'（language_code=2）のとき setLang('undefined') が呼ばれる", async () => {
    const target = {
      user: {
        user_cd: "u123",
        user_name: "Test",
        user_account: "acc",
        email: "e@example.com",
        perm_cd: "",
        language_code: 2, // neither 0 nor 1 → "undefined"
      },
      center: [],
    };
    makeStore({ user: { adList: { searchCondition: undefined, data: target as any }, isLoading: false } });
    // lang が "undefined" の状態で保存を試みるために radioGroup の value を確認
    await waitFor(() => {
      const radioGroup = screen.getByTestId("radio-group");
      // lang = "undefined" なので どのラジオも checked=true にならない
      expect(radioGroup.dataset.value).toBe("undefined");
    });
  });

  it("adList.data の belonging: matchedGroup が見つからないとき null をセット", async () => {
    const target = {
      user: {
        user_cd: "u123",
        user_name: "Test",
        user_account: "acc",
        email: "e@example.com",
        perm_cd: "",
        language_code: 0,
      },
      center: [{ center_cd: "no-match", belonging_flg: 0 }], // groups に "no-match" はない
    };
    makeStore({
      user: { adList: { searchCondition: undefined, data: target as any }, isLoading: false },
      groups: [{ value: "other-center", label: "Other" }],
    });
    await waitFor(() => {
      // belonging = null → AutoCompleteSingle の value が "" になる
      const select = screen.getByTestId("auto-complete-single") as HTMLSelectElement;
      expect(select.value).toBe("");
    });
  });

  it("perm_name が空文字のとき SelectItem に '()' が付かない", async () => {
    const permissionList = [
      {
        perm_cd: "perm_no_name",
        perm_name: "", // empty → no parentheses
        search_cd1: 1,
        search_cd2: 2,
        search_cd3: 3,
        can_job_create: 1,
        can_status_import: 0,
        can_access_authority: 0,
        can_status_change: 1,
        can_job_change_expiry: 0,
        can_job_change: 0,
        can_status_reissue: 0,
        can_job_arrow_user: 0,
        can_log_search: 1,
        can_manage: 1,
        can_ng_word: 0,
        can_auto_delete: 0,
      },
    ];
    makeStore({ permissionList });
    const select = screen.getByTestId("select") as HTMLSelectElement;
    // 空文字 perm_name のとき '()' なし
    expect(select.innerHTML).not.toContain("()");
  });

  it("search_cd が 0 のとき SearchConditionValMap に値がなく '나し' を表示する", async () => {
    const permissionList = [
      {
        perm_cd: "perm_zero",
        perm_name: "権限ゼロ",
        search_cd1: 0 as any, // invalid → undefined → "なし"
        search_cd2: 1,
        search_cd3: 2,
        can_job_create: 1,
        can_status_import: 0,
        can_access_authority: 0,
        can_status_change: 1,
        can_job_change_expiry: 0,
        can_job_change: 0,
        can_status_reissue: 0,
        can_job_arrow_user: 0,
        can_log_search: 1,
        can_manage: 1,
        can_ng_word: 0,
        can_auto_delete: 0,
      },
    ];
    const { user } = makeStore({ permissionList });
    const select = screen.getByTestId("select") as HTMLSelectElement;
    await user.selectOptions(select, "perm_zero");
    await waitFor(() => {
      expect(screen.getByText("権限内容")).toBeInTheDocument();
      // search_cd1=0 → undefined → "なし"
      expect(screen.getAllByText("なし").length).toBeGreaterThan(0);
    });
  });

  it("保存失敗（Error オブジェクト）で '保存に失敗しました' を toast.error に渡す", async () => {
    const { user, dispatchSpy } = makeStore();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "Valid Name" } });
    fireEvent.change(inputs[2], { target: { value: "validacc" } });
    fireEvent.change(inputs[3], { target: { value: "valid@example.com" } });

    // ① 準備: updateUserInfo を Error で reject（冒頭の thunk 偽装イディオム参照）。
    //    Error は文字列でないため、固定メッセージ "保存に失敗しました" になる。
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "updateUserInfo") {
        return Object.assign(Promise.resolve({}), {
          unwrap: () => Promise.reject(new Error("サーバーエラー")),
        });
      }
      return Promise.resolve(action);
    }) as any);

    await user.click(screen.getByText("保存")); // ② 操作

    await waitFor(() => {                        // ③ 待つ
      expect(toast.error).toHaveBeenCalledWith("保存に失敗しました");
    });
  });

  it("削除失敗（文字列）で その文字列を toast.error に渡す", async () => {
    const { user, dispatchSpy } = makeStore();

    // ① 準備: removeUser を「文字列で reject」（→ catch で文字列をそのまま toast へ）
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "removeUser") {
        return Object.assign(Promise.resolve({}), {
          unwrap: () => Promise.reject("権限不足"),
        });
      }
      return Promise.resolve(action);
    }) as any);

    await user.click(screen.getByText("削除する")); // ② 操作

    await waitFor(() => {                            // ③ 待つ
      expect(toast.error).toHaveBeenCalledWith("権限不足");
    });
  });

  it("保存: language_code=undefined(lang='undefined') のとき params の language_code が undefined", async () => {
    const permissionList = [
      {
        perm_cd: "perm1",
        perm_name: "権限1",
        search_cd1: 1,
        search_cd2: 2,
        search_cd3: 3,
        can_job_create: 1,
        can_status_import: 0,
        can_access_authority: 0,
        can_status_change: 1,
        can_job_change_expiry: 0,
        can_job_change: 0,
        can_status_reissue: 0,
        can_job_arrow_user: 0,
        can_log_search: 1,
        can_manage: 1,
        can_ng_word: 0,
        can_auto_delete: 0,
      },
    ];
    const target = {
      user: {
        user_cd: "u123",
        user_name: "Lang Test",
        user_account: "langacc",
        email: "lang@example.com",
        perm_cd: "perm1",
        language_code: 2, // → lang = "undefined"
      },
      center: [],
    };
    const { user, dispatchSpy } = makeStore({
      user: { adList: { searchCondition: undefined, data: target as any }, isLoading: false },
      permissionList,
    });

    // ① 準備: updateUserInfo を成功させる（冒頭の thunk 偽装イディオム参照）。
    //    このテストの主眼は params の中身（language_code / center_cd 等）の検証。
    const updateResult = { type: "user/updateUserInfo/fulfilled", payload: {} };
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "updateUserInfo") {
        return Object.assign(Promise.resolve(updateResult), {
          unwrap: () => Promise.resolve(updateResult.payload),
        });
      }
      return Promise.resolve(action);
    }) as any);

    await user.click(screen.getByText("保存")); // ② 操作

    await waitFor(() => {
      expect(updateUserInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ language_code: undefined }),
        }),
      );
    });
  });

  it("保存: belonging が null のとき center_cd='' でパラメータ送信", async () => {
    const permissionList = [
      {
        perm_cd: "perm1",
        perm_name: "権限1",
        search_cd1: 1,
        search_cd2: 2,
        search_cd3: 3,
        can_job_create: 1,
        can_status_import: 0,
        can_access_authority: 0,
        can_status_change: 1,
        can_job_change_expiry: 0,
        can_job_change: 0,
        can_status_reissue: 0,
        can_job_arrow_user: 0,
        can_log_search: 1,
        can_manage: 1,
        can_ng_word: 0,
        can_auto_delete: 0,
      },
    ];
    const target = {
      user: {
        user_cd: "u123",
        user_name: "No Center",
        user_account: "nocenteracc",
        email: "nocenter@example.com",
        perm_cd: "perm1",
        language_code: 0,
      },
      center: [], // no center → belonging = null
    };
    const { user, dispatchSpy } = makeStore({
      user: { adList: { searchCondition: undefined, data: target as any }, isLoading: false },
      permissionList,
    });

    // ① 準備: updateUserInfo を成功させる（冒頭の thunk 偽装イディオム参照）。
    //    このテストの主眼は params の中身（language_code / center_cd 等）の検証。
    const updateResult = { type: "user/updateUserInfo/fulfilled", payload: {} };
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "updateUserInfo") {
        return Object.assign(Promise.resolve(updateResult), {
          unwrap: () => Promise.resolve(updateResult.payload),
        });
      }
      return Promise.resolve(action);
    }) as any);

    await user.click(screen.getByText("保存")); // ② 操作

    await waitFor(() => {
      expect(updateUserInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ center_cd: "" }),
        }),
      );
    });
  });

  it("user_cd が undefined のとき useEffect の早期 return が呼ばれる（line 239）", async () => {
    (globalThis as any).mockParams = {};
    const { dispatchSpy } = makeStore();
    await waitFor(() => {
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "getUserInfo" }),
      );
    });
  });

  it("language_code=1 のとき lang='en' がセットされる（line 267）", async () => {
    const target = {
      user: {
        user_cd: "u123",
        user_name: "En User",
        user_account: "enacc",
        email: "en@example.com",
        perm_cd: "",
        language_code: 1,
      },
      center: [],
    };
    makeStore({ user: { adList: { searchCondition: undefined, data: target as any }, isLoading: false } });
    await waitFor(() => {
      const radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup.dataset.value).toBe("en");
    });
  });

  it("保存: language_code=1(lang='en') のとき params の language_code が 1（line 371 en 分岐）", async () => {
    const permissionList = [
      {
        perm_cd: "perm1",
        perm_name: "権限1",
        search_cd1: 1,
        search_cd2: 2,
        search_cd3: 3,
        can_job_create: 1,
        can_status_import: 0,
        can_access_authority: 0,
        can_status_change: 1,
        can_job_change_expiry: 0,
        can_job_change: 0,
        can_status_reissue: 0,
        can_job_arrow_user: 0,
        can_log_search: 1,
        can_manage: 1,
        can_ng_word: 0,
        can_auto_delete: 0,
      },
    ];
    const target = {
      user: {
        user_cd: "u123",
        user_name: "En User",
        user_account: "enacc",
        email: "en@example.com",
        perm_cd: "perm1",
        language_code: 1, // → lang = "en"
      },
      center: [],
    };
    const { user, dispatchSpy } = makeStore({
      user: { adList: { searchCondition: undefined, data: target as any }, isLoading: false },
      permissionList,
    });

    // ① 準備: updateUserInfo を成功させる（冒頭の thunk 偽装イディオム参照）。
    //    このテストの主眼は params の中身（language_code / center_cd 等）の検証。
    const updateResult = { type: "user/updateUserInfo/fulfilled", payload: {} };
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "updateUserInfo") {
        return Object.assign(Promise.resolve(updateResult), {
          unwrap: () => Promise.resolve(updateResult.payload),
        });
      }
      return Promise.resolve(action);
    }) as any);

    await user.click(screen.getByText("保存")); // ② 操作

    await waitFor(() => {
      expect(updateUserInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ language_code: 1 }),
        }),
      );
    });
  });

  it("adList.data で user_name/user_account/email が null のとき空文字をセットする（lines 257-259）", async () => {
    const target = {
      user: {
        user_cd: "u123",
        user_name: null,
        user_account: null,
        email: null,
        perm_cd: null,
        language_code: 0,
      },
      center: [],
    };
    makeStore({ user: { adList: { searchCondition: undefined, data: target as any }, isLoading: false } });
    await waitFor(() => {
      const inputs = screen.getAllByRole("textbox");
      // 表示名, アカウント, メール がそれぞれ空文字
      expect((inputs[1] as HTMLInputElement).value).toBe("");
      expect((inputs[2] as HTMLInputElement).value).toBe("");
      expect((inputs[3] as HTMLInputElement).value).toBe("");
    });
  });
});
