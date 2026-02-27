import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { configureStore } from "@reduxjs/toolkit";

import { SideMenu } from "./SideMenu";
import { setup } from "@test-utils";
import { uiActions, uiSliceReducer } from "@/redux/slices/uiSlice";

jest.mock("lucide-react", () => ({
  Home: () => <span data-testid="icon-home" />,
  Search: () => <span data-testid="icon-search" />,
  Database: () => <span data-testid="icon-db" />,
  FileSearch: () => <span data-testid="icon-file-search" />,
  FilePlus2: () => <span data-testid="icon-file-plus" />,
  Wrench: () => <span data-testid="icon-wrench" />,
  Cloud: () => <span data-testid="icon-cloud" />,
  Lock: () => <span data-testid="icon-lock" />,
  ChevronLeft: () => <span data-testid="icon-left" />,
  ChevronRight: () => <span data-testid="icon-right" />,
}));

const createWrapper = (path: string, preloadedState?: object) => {
  const store = configureStore({
    reducer: { ui: uiSliceReducer },
    preloadedState,
  });
  const dispatchSpy = jest.spyOn(store, "dispatch");
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </Provider>
  );
  return { Wrapper, dispatchSpy };
};

describe("SideMenu", () => {
  it("クリックで onHandle が呼ばれる", async () => {
    const onHandle = jest.fn();
    const { Wrapper } = createWrapper("/manage/User");
    const { user } = setup(
      <SideMenu collapsed={false} onHandle={onHandle} />,
      { wrapper: Wrapper },
    );

    await user.click(screen.getByRole("button", { name: "Collapse menu" }));

    expect(onHandle).toHaveBeenCalled();
  });

  it("collapsed=false のときに Ops Console を表示する", () => {
    const { Wrapper } = createWrapper("/manage/User");
    setup(<SideMenu collapsed={false} onHandle={jest.fn()} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText("Ops Console")).toBeInTheDocument();
  });

  it("管理配下では lastVisited を更新する", async () => {
    const { Wrapper, dispatchSpy } = createWrapper("/manage/User");
    setup(<SideMenu collapsed={false} onHandle={jest.fn()} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        uiActions.setLastVisited({
          key: "/manage",
          path: "/manage/User",
        }),
      );
    });
  });

  it("collapsed=true のときはラベルを省略して表示する", () => {
    const { Wrapper } = createWrapper("/manage/User");
    setup(<SideMenu collapsed onHandle={jest.fn()} />, {
      wrapper: Wrapper,
    });

    expect(screen.queryByText("Ops Console")).not.toBeInTheDocument();
    expect(screen.getByText("JOB¥nSEARCH")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Expand menu" }),
    ).toBeInTheDocument();
  });

  it("lastVisited が同じ場合は更新しない", async () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper, dispatchSpy } = createWrapper("/manage/User", {
      ui: {
        ...baseUiState,
        lastVisited: {
          "/manage": "/manage/User",
        },
      },
    });
    setup(<SideMenu collapsed={false} onHandle={jest.fn()} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        uiActions.setLastVisited({
          key: "/manage",
          path: "/manage/User",
        }),
      );
    });
  });

  it("remember 対象でないパスでは更新しない", async () => {
    const { Wrapper, dispatchSpy } = createWrapper("/");
    setup(<SideMenu collapsed={false} onHandle={jest.fn()} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  it("lastVisited をリンク先として使う", () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper } = createWrapper("/OA/Users", {
      ui: {
        ...baseUiState,
        lastVisited: {
          "/manage": "/manage/User/abc",
        },
      },
    });
    setup(<SideMenu collapsed={false} onHandle={jest.fn()} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByRole("link", { name: "管理" })).toHaveAttribute(
      "href",
      "/manage/User/abc",
    );
  });
});
