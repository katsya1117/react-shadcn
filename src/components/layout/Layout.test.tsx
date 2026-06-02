import { screen } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { userSliceReducer } from "@/redux/slices/userSlice";
import { uiSliceReducer, uiActions } from "@/redux/slices/uiSlice";
import { Layout } from "./Layout";

// SideMenu, Header, TabsBar render as real components:
// - SideMenu has data-testid="side-menu" on its root element
// - Header has data-testid="header" on its <header> element
// - TabsBar has data-testid="tabs-bar" on its root div (only when path matches /manage/ or /OA/)

describe("Layout", () => {
  const baseUserState = userSliceReducer(undefined, { type: "@@INIT" });
  const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
  const reducers = { user: userSliceReducer, ui: uiSliceReducer };

  beforeEach(() => {
    // Set path to /manage/User so TabsBar renders
    (globalThis as any).mockLocation = {
      pathname: "/manage/User",
      search: "",
      hash: "",
      state: null,
      key: "default",
    };
  });

  afterEach(() => {
    (globalThis as any).mockLocation = {
      pathname: "/",
      search: "",
      hash: "",
      state: null,
      key: "default",
    };
  });

  it("デフォルトで SideMenu/Header/TabsBar/children を表示する", () => {
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

    expect(screen.getByTestId("side-menu")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("tabs-bar")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("hideSideMenu=true の場合は SideMenu を表示しない", () => {
    setupWithStore(
      <Layout hideSideMenu>
        <div data-testid="child" />
      </Layout>,
      {
        reducers,
        preloadedState: { user: baseUserState, ui: baseUiState },
      },
    );

    expect(screen.queryByTestId("side-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("hideHeader=true の場合は Header を表示しない", () => {
    setupWithStore(
      <Layout hideHeader>
        <div data-testid="child" />
      </Layout>,
      {
        reducers,
        preloadedState: { user: baseUserState, ui: baseUiState },
      },
    );

    expect(screen.queryByTestId("header")).not.toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("hideTabs=true の場合は TabsBar を表示しない", () => {
    setupWithStore(
      <Layout hideTabs>
        <div data-testid="child" />
      </Layout>,
      {
        reducers,
        preloadedState: { user: baseUserState, ui: baseUiState },
      },
    );

    expect(screen.queryByTestId("tabs-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("fluid=true のとき children を表示する", () => {
    setupWithStore(
      <Layout fluid>
        <div data-testid="child" />
      </Layout>,
      {
        reducers,
        preloadedState: { user: baseUserState, ui: baseUiState },
      },
    );

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
          user: baseUserState,
          ui: baseUiState,
        },
      },
    );

    await user.click(screen.getByRole("button", { name: "Collapse menu" }));

    expect(dispatchSpy).toHaveBeenCalledWith(uiActions.toggleSideMenu());
  });
});
