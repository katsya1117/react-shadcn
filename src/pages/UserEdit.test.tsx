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
import { screen, waitFor } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import React from "react";
import { UserEdit } from "./UserEdit";

// Mocks handled via moduleNameMapper: react-router, userSlice, permissionSlice, sonner, ConfirmButton

jest.mock("@/components/common/AutoComplete/AutoCompleteSingle", () => ({
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

    const updateResult = { type: "user/updateUserInfo/fulfilled", payload: {} };
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "getUserInfo") {
        return Promise.resolve({});
      }
      if (action?.type === "updateUserInfo") {
        return Object.assign(Promise.resolve(updateResult), {
          unwrap: () => Promise.resolve(updateResult.payload),
        });
      }
      return Promise.resolve(action);
    }) as any);

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

  it("削除成功後はユーザー検索へ戻し、遷移先でtoastを出すstateを渡す", async () => {
    const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;
    const { user, dispatchSpy } = makeStore();

    const removeResult = { type: "user/removeUser/fulfilled", payload: true };
    dispatchSpy.mockImplementation(((action: any) => {
      if (action?.type === "removeUser") {
        return Object.assign(Promise.resolve(removeResult), {
          unwrap: () => Promise.resolve(removeResult.payload),
        });
      }
      return Promise.resolve(action);
    }) as any);

    await user.click(screen.getByText("削除する"));

    expect(removeUser).toHaveBeenCalledWith("u123");
    expect(toast.success).not.toHaveBeenCalledWith(
      expect.stringContaining("削除"),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/manage/User", {
      replace: true,
      state: { deletedUserCd: "u123" },
    });
  });
});
