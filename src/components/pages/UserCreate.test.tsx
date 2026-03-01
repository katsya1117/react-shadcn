import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { UserCreate } from "./UserCreate";
import {
  getAdUserList,
  userCreation,
  userSliceReducer,
} from "@/redux/slices/userSlice";
import { createMockPagination, setupWithStore } from "@test-utils";
import { toast } from "@/components/ui/sonner";

type UserState = ReturnType<typeof userSliceReducer>;

const buildUserState = (overrides: Partial<UserState> = {}) => {
  const base = userSliceReducer(undefined, { type: "@@INIT" });
  return {
    user: {
      ...base,
      ...overrides,
      list: {
        ...base.list,
        ...(overrides.list ?? {}),
      },
      adList: {
        ...base.adList,
        ...(overrides.adList ?? {}),
      },
      searchResultDisp: {
        ...base.searchResultDisp,
        ...(overrides.searchResultDisp ?? {}),
      },
    },
  };
};

let radioOnValueChange: ((value: string) => void) | undefined;

jest.mock("@/components/ui/confirm-button", () => ({
  __esModule: true,
  default: ({ onClick, buttonLabel }: any) => (
    <button onClick={onClick}>{buttonLabel}</button>
  ),
  ConfirmButton: ({ onClick, buttonLabel }: any) => (
    <button onClick={onClick}>{buttonLabel}</button>
  ),
}));

// コンポーネント内の相対パスで参照される ConfirmButton もモックする
jest.mock("../ui/confirm-button", () => ({
  __esModule: true,
  default: ({ onClick, buttonLabel }: any) => (
    <button onClick={onClick}>{buttonLabel}</button>
  ),
}));

function passthrough(tag: keyof JSX.IntrinsicElements = "div") {
  return ({ children, ...rest }: any) =>
    React.createElement(tag, rest, children);
}

jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  Button: passthrough("button"),
}));
jest.mock("@/components/ui/card", () => ({
  __esModule: true,
  Card: passthrough(),
  CardContent: passthrough(),
  CardHeader: passthrough(),
  CardFooter: passthrough(),
}));
jest.mock("@/components/ui/field", () => ({
  __esModule: true,
  Field: passthrough(),
  FieldGroup: passthrough(),
  FieldLabel: ({ children, ...rest }: any) => (
    <label {...rest}>{children}</label>
  ),
  FieldSet: passthrough(),
}));
jest.mock("@/components/ui/input-group", () => ({
  __esModule: true,
  InputGroup: passthrough(),
  InputGroupAddon: passthrough(),
  InputGroupInput: ({ ...rest }: any) => <input {...rest} />,
  InputGroupText: passthrough(),
}));
jest.mock("@/components/ui/label", () => ({
  __esModule: true,
  Label: ({ children, ...rest }: any) => <label {...rest}>{children}</label>,
}));
jest.mock("@/components/ui/radio-group", () => ({
  __esModule: true,
  RadioGroup: ({ children, onValueChange }: any) => {
    radioOnValueChange = onValueChange;
    return <div>{children}</div>;
  },
  RadioGroupItem: ({ value, ...rest }: any) => (
    <input
      type="radio"
      value={value}
      onChange={(e) => radioOnValueChange?.(e.target.value)}
      {...rest}
    />
  ),
}));
jest.mock("@/components/ui/table", () => ({
  __esModule: true,
  Table: passthrough("table"),
  TableBody: passthrough("tbody"),
  TableCell: passthrough("td"),
  TableHead: passthrough("th"),
  TableHeader: passthrough("thead"),
  TableRow: passthrough("tr"),
}));

jest.mock("@/redux/slices/userSlice", () => {
  const actual = jest.requireActual("@/redux/slices/userSlice");
  const userCreationMock = jest.fn((arg) => ({
    type: "userCreation",
    meta: { arg },
  }));
  (userCreationMock as any).fulfilled = {
    match: (action: any) => action.type === "userCreation",
  };
  return {
    ...actual,
    userSelector: {
      ...actual.userSelector,
      adUserListSelector: actual.userSelector.adUserListSelector,
    },
    getAdUserList: jest.fn((arg) => ({ type: "getAdUserList", payload: arg })),
    userCreation: userCreationMock,
  };
});

jest.mock("@/components/ui/sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("UserCreate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("検索ボタンで getAdUserList を dispatch する", async () => {
    const { user, dispatchSpy } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: { searchCondition: undefined, data: undefined },
        searchResultDisp: { addSearched: false, settingSearched: false },
      }),
    });

    await user.type(screen.getByLabelText("表示名"), "foo");
    await user.type(screen.getByLabelText("アカウント名"), "bar");
    await user.type(screen.getByLabelText("メールアドレス"), "baz");

    await user.click(screen.getAllByText("検索")[0]);

    expect(getAdUserList).toHaveBeenCalledWith(
      expect.objectContaining({
        mail_addr: "baz",
        order: "asc",
        sort: "disp_name",
      }),
    );
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it("検索結果なしの時にメッセージを表示する", () => {
    setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: { searchCondition: {}, data: undefined },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });
    expect(
      screen.getByText("条件に合うユーザーが見つかりませんでした"),
    ).toBeInTheDocument();
  });

  it("検索結果が空配列のときはメッセージを表示する", () => {
    setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: {},
          data: { items: [], pagination: createMockPagination() },
        },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });
    expect(
      screen.getByText("条件に合うユーザーが見つかりませんでした"),
    ).toBeInTheDocument();
  });

  it("items が undefined のときはメッセージを表示する", () => {
    setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: {},
          data: { items: undefined as any, pagination: createMockPagination() },
        },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });
    expect(
      screen.getByText("条件に合うユーザーが見つかりませんでした"),
    ).toBeInTheDocument();
  });

  it("登録済みの場合は「登録済み」を表示する", () => {
    setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: {},
          data: {
            items: [
              {
                mail_addr: "user@example.com",
                account_name: "user",
                disp_name: "User",
                organization_unit: "部",
                distinguished_name: "dn",
                status1: "1",
                status2: "1",
              },
            ],
            pagination: createMockPagination(),
          },
        },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });
    expect(screen.getByText("登録済み")).toBeInTheDocument();
  });

  it("登録ボタンで userCreation が dispatch される", async () => {
    const { user } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: {},
          data: {
            items: [
              {
                mail_addr: "new@example.com",
                account_name: "new",
                disp_name: "New User",
                organization_unit: "部",
                distinguished_name: "dn",
                status1: "0",
                status2: "0",
              },
            ],
            pagination: createMockPagination(),
          },
        },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });
    await user.click(screen.getByText("登録"));

    expect(userCreation).toHaveBeenCalledWith(
      expect.objectContaining({ user_cd: "new", email: "new@example.com" }),
    );
  });

  it("userCreation が失敗したときは再検索しない", async () => {
    const originalMatch = (userCreation as any).fulfilled.match;
    (userCreation as any).fulfilled.match = jest.fn(() => false);

    const { user } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: {},
          data: {
            items: [
              {
                mail_addr: "new@example.com",
                account_name: "new",
                disp_name: "New User",
                organization_unit: "部",
                distinguished_name: "dn",
                status1: "0",
                status2: "0",
              },
            ],
            pagination: createMockPagination(),
          },
        },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });

    await user.click(screen.getByText("登録"));

    expect(getAdUserList).not.toHaveBeenCalled();

    (userCreation as any).fulfilled.match = originalMatch;
  });

  it("メールアドレスが長すぎる場合は toast.error を出して dispatch しない", async () => {
    const longMail = `${"a".repeat(210)}@example.com`;
    const { user } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: {},
          data: {
            items: [
              {
                mail_addr: longMail,
                account_name: "user",
                disp_name: "User",
                organization_unit: "部",
                distinguished_name: "dn",
                status1: "0",
                status2: "0",
              },
            ],
            pagination: createMockPagination(),
          },
        },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });

    await user.click(screen.getByText("登録"));

    expect(toast.error).toHaveBeenCalledWith(
      "入力値が長すぎます",
      expect.objectContaining({
        description: expect.stringContaining("メールアドレス"),
      }),
    );
    expect(userCreation).not.toHaveBeenCalled();
  });

  it("ADユーザー更新ボタン押下で toast.success を表示する", async () => {
    const { user } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState(),
    });

    await user.click(screen.getByRole("button", { name: "ADユーザー更新" }));

    expect(toast.success).toHaveBeenCalledWith("ADユーザーを更新しました");
  });

  it("登録状況を変更して検索すると status が反映される", async () => {
    const { user } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState(),
    });

    await user.click(screen.getByLabelText("登録済みのみ"));
    await user.click(screen.getByRole("button", { name: "検索" }));

    expect(getAdUserList).toHaveBeenCalledWith(
      expect.objectContaining({ status: "1" }),
    );
  });

  it("クリアボタンで入力をリセットする", async () => {
    const { user } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: { disp_name: "x" } as any,
          data: undefined,
        },
        searchResultDisp: { addSearched: false, settingSearched: false },
      }),
    });

    const display = screen.getByLabelText("表示名") as HTMLInputElement;
    const account = screen.getByLabelText("アカウント名") as HTMLInputElement;
    const mail = screen.getByLabelText("メールアドレス") as HTMLInputElement;

    await user.type(display, "foo");
    await user.type(account, "bar");
    await user.type(mail, "baz");

    await user.click(screen.getByText("クリア"));

    expect(display.value).toBe("");
    expect(account.value).toBe("");
    expect(mail.value).toBe("");
  });

  it("入力値超過時は toast.error を出して dispatch しない", async () => {
    const long = "x".repeat(120);
    const { user } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: {},
          data: {
            items: [
              {
                mail_addr: `${long}@example.com`,
                account_name: long,
                disp_name: long,
                organization_unit: "部",
                distinguished_name: "dn",
                status1: "0",
                status2: "0",
              },
            ],
            pagination: createMockPagination(),
          },
        },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });

    await user.click(screen.getByText("登録"));
    expect(toast.error).toHaveBeenCalled();
    expect(userCreation).not.toHaveBeenCalled();
  });

  it("ページネーション操作時に getAdUserList が dispatch される", async () => {
    const { user } = setupWithStore(<UserCreate />, {
      reducers: { user: userSliceReducer },
      preloadedState: buildUserState({
        adList: {
          searchCondition: {},
          data: {
            items: [
              {
                mail_addr: "user@example.com",
                account_name: "user",
                disp_name: "User",
                organization_unit: "部",
                distinguished_name: "dn",
                status1: "0",
                status2: "0",
              },
            ],
            pagination: createMockPagination({
              total: 100,
              last_page: 10,
              current_page: 1,
            }),
          },
        },
        searchResultDisp: { addSearched: true, settingSearched: false },
      }),
    });

    await user.click(screen.getByTestId("pagination-mock"));

    expect(getAdUserList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });
});
