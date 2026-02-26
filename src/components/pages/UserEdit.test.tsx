import { toast } from "@/components/ui/sonner";
import { getPermissionList } from "@/redux/slices/permissionSlice";
import {
  getUserInfo,
  updateUserInfo,
  userSliceReducer,
} from "@/redux/slices/userSlice";
import { screen, waitFor } from "@testing-library/react";
import { setup } from "@test-utils";
import React from "react";
import { MemoryRouter } from "react-router";
import { useSelector } from "react-redux";
import { UserEdit } from "./UserEdit";

// ----- mocks ----- //
const mockDispatch = jest.fn();

jest.mock("react-redux", () => {
  const actual = jest.requireActual("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: jest.fn(),
  };
});

jest.mock("react-router", () => {
  const actual = jest.requireActual("react-router");
  return {
    ...actual,
    useParams: () => ({ user_cd: "u123" }),
    NavLink: ({ to, children }: any) => <a href={to}>{children}</a>,
  };
});

jest.mock("@/components/ui/sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/pages/UserTabsShell", () => ({
  __esModule: true,
  UserTabsShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-shell">{children}</div>
  ),
}));

jest.mock("@/components/parts/AutoComplete/AutoCompleteSingle", () => ({
  __esModule: true,
  AutoCompleteSingle: ({ value, onChange }: any) => (
    <select
      data-testid="auto-complete-single"
      value={value?.value ?? ""}
      onChange={(e) =>
        onChange({ value: e.target.value, label: e.target.value })
      }
    >
      <option value="">選択してください</option>
      <option value="c1">c1</option>
    </select>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  __esModule: true,
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid="select-permission"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectGroup: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

jest.mock("@/components/ui/confirm-button", () => ({
  __esModule: true,
  ConfirmButton: ({ onHandle, buttonLabel }: any) => (
    <button onClick={() => onHandle && onHandle()}>{buttonLabel}</button>
  ),
  ConFirmButton: ({ onHandle, buttonLabel }: any) => (
    <button onClick={() => onHandle && onHandle()}>{buttonLabel}</button>
  ),
}));

jest.mock("@/components/ui/radio-group", () => ({
  __esModule: true,
  RadioGroup: ({ value, onValueChange, children }: any) => (
    <div data-testid="radio-group" data-value={value}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onChange: (e: any) => onValueChange(e.target.value),
          checked: value === child.props.value,
        }),
      )}
    </div>
  ),
  RadioGroupItem: ({ id, value, checked, onChange }: any) => (
    <input
      id={id}
      type="radio"
      value={value}
      checked={checked}
      onChange={onChange}
    />
  ),
}));

jest.mock("@/redux/slices/userSlice", () => {
  const actual = jest.requireActual("@/redux/slices/userSlice");
  const mockGetUserInfo = jest.fn((arg) => ({
    type: "getUserInfo",
    payload: arg,
  }));
  const mockUpdateUserInfo = jest.fn((arg) => ({
    type: "updateUserInfo",
    payload: arg,
  }));
  (mockUpdateUserInfo as any).fulfilled = {
    match: (action: any) => action.type === "user/updateUserInfo/fulfilled",
  };
  const mockRemoveUser = jest.fn((arg) => ({
    type: "removeUser",
    payload: arg,
  }));
  (mockRemoveUser as any).fulfilled = {
    match: (action: any) => action.type === "user/removeUser/fulfilled",
  };
  return {
    ...actual,
    getUserInfo: mockGetUserInfo,
    updateUserInfo: mockUpdateUserInfo,
    removeUser: mockRemoveUser,
  };
});

jest.mock("@/redux/slices/permissionSlice", () => {
  const actual = jest.requireActual("@/redux/slices/permissionSlice");
  const mockGetPermissionList = jest.fn(() => ({ type: "getPermissionList" }));
  return { ...actual, getPermissionList: mockGetPermissionList };
});

// ----- helpers ----- //
const useSelectorMock = useSelector as jest.Mock;

const buildUserState = (
  overrides: Partial<ReturnType<typeof userSliceReducer>> = {},
) => {
  const base = userSliceReducer(undefined, { type: "@@INIT" });
  return { user: { ...base, ...overrides } } as any;
};

const basePermissionState = { permission: { permissionList: null } } as any;
const baseAutoCompleteState = {
  autoComplete: {
    isLoading: false,
    error: { code: 0, message: "" },
    users: [],
    groups: [],
  },
} as any;

// ----- tests ----- //
describe("UserEdit", () => {
  afterEach(() => {
    jest.clearAllMocks();
    useSelectorMock.mockReset();
  });

  it("初期表示で getUserInfo と getPermissionList を dispatch する", async () => {
    const state = {
      ...buildUserState(),
      ...basePermissionState,
      ...baseAutoCompleteState,
    };
    useSelectorMock.mockImplementation((selector: any) => selector(state));

    setup(
      <MemoryRouter>
        <UserEdit />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getUserInfo).toHaveBeenCalledWith("u123");
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "getUserInfo" }),
      );
      expect(getPermissionList).toHaveBeenCalled();
    });
  });

  it("バリデーションエラーで保存せず toast.error を出す", async () => {
    const state = {
      ...buildUserState(),
      ...basePermissionState,
      ...baseAutoCompleteState,
    };
    useSelectorMock.mockImplementation((selector: any) => selector(state));

    const { user } = setup(
      <MemoryRouter>
        <UserEdit />
      </MemoryRouter>,
    );

    const inputs = screen.getAllByRole("textbox");
    // 0: user_cd (readonly), 1: 表示名, 2: アカウント, 3: メール
    await user.type(inputs[1], "a".repeat(101)); // over MAX_DISP_LEN

    await user.click(screen.getByText("保存"));

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

    const target = {
      user: {
        user_cd: "u123",
        user_name: "Name",
        user_account: "acc",
        email: "mail",
        perm_cd: "perm1",
        language_code: 0,
      },
      center: [{ center_cd: "c1", belonging_flg: 0 }],
    };

    const state = {
      ...buildUserState({
        adList: { searchCondition: undefined, data: target as any },
        isLoading: false,
      }),
      permission: { permissionList },
      autoComplete: {
        isLoading: false,
        error: { code: 0, message: "" },
        users: [],
        groups: [{ value: "c1", label: "c1" }],
      },
    };
    useSelectorMock.mockImplementation((selector: any) => selector(state));

    mockDispatch
      .mockResolvedValueOnce({}) // getUserInfo
      .mockResolvedValueOnce({ type: "user/updateUserInfo/fulfilled" }); // updateUserInfo

    const { user } = setup(
      <MemoryRouter>
        <UserEdit />
      </MemoryRouter>,
    );

    const inputs = screen.getAllByRole("textbox");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "New Name");
    await user.clear(inputs[2]);
    await user.type(inputs[2], "newacc");
    await user.clear(inputs[3]);
    await user.type(inputs[3], "new@example.com");

    await user.click(screen.getByText("保存"));

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
});
