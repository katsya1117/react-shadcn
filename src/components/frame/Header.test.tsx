import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Header } from "./Header";
import { setup } from "@test-utils";
import { userSliceReducer } from "@/redux/slices/userSlice";
import { UrlPath } from "@/constant/UrlPath";
import type { UserInfo } from "@/api";

jest.mock("@/components/parts/Information/Information", () => ({
  Information: () => <div data-testid="information" />,
}));

jest.mock("@/components/parts/Version/VersionInfo", () => ({
  VersionInfo: () => <div data-testid="version" />,
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (next: boolean) => void;
  }) => (
    <div>
      <button
        type="button"
        data-testid="dropdown-toggle"
        onClick={() => onOpenChange?.(!open)}
      >
        toggle
      </button>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("lucide-react", () => ({
  ChevronUp: () => <span data-testid="chevron-up" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
  UserRound: () => <span data-testid="user-round" />,
}));

describe("Header", () => {
  const baseUserState = userSliceReducer(undefined, { type: "@@INIT" });
  const loginUserInfo: UserInfo = {
    user: { user_cd: "u1", disp_name: "User One" },
    user_cd: "u1",
    disp_name: "User One",
  };

  const renderHeader = (path: string, userOverrides = {}) => {
    const store = configureStore({
      reducer: { user: userSliceReducer },
      preloadedState: { user: { ...baseUserState, ...userOverrides } },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </Provider>
    );
    return setup(<Header />, { wrapper: Wrapper });
  };

  it("loginUser が無いときは何も表示しない", () => {
    renderHeader("/manage/User");

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("パスに応じたタイトルとユーザー情報を表示する", () => {
    renderHeader("/manage/User", { loginUserInfo });

    expect(screen.getByText("管理")).toBeInTheDocument();
    expect(screen.getByText("u1(User One)")).toBeInTheDocument();
  });

  it("パスが一致しない場合は Ops Console を表示する", () => {
    renderHeader("/unknown", { loginUserInfo });

    expect(screen.getByText("Ops Console")).toBeInTheDocument();
  });

  it("ドロップダウンのリンク先が正しい", () => {
    renderHeader("/manage/User", { loginUserInfo });

    expect(
      screen.getByRole("link", { name: "MyPage設定変更" }),
    ).toHaveAttribute("href", UrlPath.MyPageEdit);
    expect(
      screen.getByRole("link", { name: "ユーザー情報設定変更" }),
    ).toHaveAttribute("href", UrlPath.UserProfile);
  });

  it("ドロップダウンの開閉でアイコンが切り替わる", async () => {
    const { user } = renderHeader("/manage/User", { loginUserInfo });

    expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
    expect(screen.queryByTestId("chevron-up")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("dropdown-toggle"));

    expect(screen.getByTestId("chevron-up")).toBeInTheDocument();
    expect(screen.queryByTestId("chevron-down")).not.toBeInTheDocument();
  });
});
