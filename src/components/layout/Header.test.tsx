import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Header } from "./Header";
import { setup } from "@test-utils";
import { userSliceReducer } from "@/redux/slices/userSlice";
import { UrlPath } from "@/constants/UrlPath";
import type { UserInfo } from "@/api";

jest.mock("@/components/common/Information/Information", () => ({
  Information: () => <div data-testid="information" />,
}));

jest.mock("@/components/common/Version/VersionInfo", () => ({
  VersionInfo: () => <div data-testid="version" />,
}));

// dropdown-menu / userSlice は共有モックを使う（lucide-react は jest.config の mapper で固定）。
// lucide のアイコンは testid がアイコン名のケバブになる（ChevronUp → "chevron-up" 等）。
jest.mock("@/components/ui/dropdown-menu");
jest.mock("@/redux/slices/userSlice");

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

  it("loginUser が無いときは Guest 表示になる", () => {
    renderHeader("/manage/User");

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("Guest")).toBeInTheDocument();
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

  it("user_cd が無いとき空文字でフォールバックする", () => {
    const loginUserWithoutCd = {
      user: { disp_name: "No CD User" } as any,
      user_cd: "",
      disp_name: "No CD User",
    };
    renderHeader("/manage/User", { loginUserInfo: loginUserWithoutCd });

    expect(screen.getByText("(No CD User)")).toBeInTheDocument();
  });

  it("disp_name が無いとき空文字でフォールバックする", () => {
    const loginUserWithoutName = {
      user: { user_cd: "u2" } as any,
      user_cd: "u2",
      disp_name: "",
    };
    renderHeader("/manage/User", { loginUserInfo: loginUserWithoutName });

    expect(screen.getByText("u2()")).toBeInTheDocument();
  });

  it("subtitle が渡されたとき表示する", () => {
    const store = configureStore({
      reducer: { user: userSliceReducer },
      preloadedState: { user: { ...baseUserState } },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={["/manage/User"]}>{children}</MemoryRouter>
      </Provider>
    );
    setup(<Header subtitle="テスト用サブタイトル" />, { wrapper: Wrapper });

    expect(screen.getByText("テスト用サブタイトル")).toBeInTheDocument();
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
