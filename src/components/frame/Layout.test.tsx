import { screen } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { userSliceReducer } from "@/redux/slices/userSlice";
import { uiSliceReducer, uiActions } from "@/redux/slices/uiSlice";

jest.mock("./SideMenu", () => ({
  SideMenu: ({ onHandle }: { onHandle: () => void }) => (
    <button data-testid="side-menu" onClick={onHandle}>
      side-menu
    </button>
  ),
}));

jest.mock("./Header", () => ({
  Header: () => <div data-testid="header" />,
}));

jest.mock("./TabsBar", () => ({
  TabsBar: () => <div data-testid="tabs-bar" />,
}));

jest.mock("../parts/SimpleSingleSignOn/SimpleSingleSignOn", () => ({
  __esModule: true,
  default: () => <div data-testid="sso" />,
}));

const { Layout } = jest.requireActual("./Layout");

describe("Layout", () => {
  const baseUserState = userSliceReducer(undefined, { type: "@@INIT" });
  const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
  const reducers = { user: userSliceReducer, ui: uiSliceReducer };

  it("ログインしていない場合は children を表示しない", () => {
    setupWithStore(
      <Layout>
        <div data-testid="child" />
      </Layout>,
      {
        reducers,
        preloadedState: {
          user: baseUserState,
          ui: baseUiState,
        },
      },
    );

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    expect(screen.getByTestId("sso")).toBeInTheDocument();
  });

  it("ログイン済みかつ isHide=false の場合に Header/SideMenu/TabsBar を表示する", () => {
    setupWithStore(
      <Layout>
        <div data-testid="child" />
      </Layout>,
      {
        reducers,
        preloadedState: {
          user: { ...baseUserState, isLogin: true },
          ui: baseUiState,
        },
      },
    );

    expect(screen.getByTestId("side-menu")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("tabs-bar")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("isHide=true の場合は Header/SideMenu/TabsBar を表示しない", () => {
    setupWithStore(
      <Layout isHide>
        <div data-testid="child" />
      </Layout>,
      {
        reducers,
        preloadedState: {
          user: { ...baseUserState, isLogin: true },
          ui: baseUiState,
        },
      },
    );

    expect(screen.queryByTestId("side-menu")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tabs-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("サイドメニューのトグル操作で dispatch される", async () => {
    const { user, dispatchSpy } = setupWithStore(
      <Layout>
        <div data-testid="child" />
      </Layout>,
      {
        reducers,
        preloadedState: {
          user: { ...baseUserState, isLogin: true },
          ui: baseUiState,
        },
      },
    );

    await user.click(screen.getByTestId("side-menu"));

    expect(dispatchSpy).toHaveBeenCalledWith(uiActions.toggleSideMenu());
  });
});
