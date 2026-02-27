import type { ReactNode } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { configureStore } from "@reduxjs/toolkit";

import { TabsBar } from "./TabsBar";
import { setup } from "@test-utils";
import { uiActions, uiSliceReducer } from "@/redux/slices/uiSlice";
import { UrlPath } from "@/constant/UrlPath";

jest.mock("./TabsBar.css.ts", () => ({
  TabsBarStyle: {
    container: "tabsbar-container",
    inner: "tabsbar-inner",
  },
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TabsTrigger: ({
    value,
    className,
    children,
  }: {
    value: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <button type="button" data-value={value} className={className}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
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

jest.mock("../ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  },
}));

jest.mock("lucide-react", () => ({
  MoreHorizontal: () => <span data-testid="more-horizontal" />,
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

let resizeCallback: (() => void) | undefined;

beforeAll(() => {
  class ResizeObserverMock {
    constructor(callback: () => void) {
      resizeCallback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock })
    .ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

const setElementWidth = (el: HTMLElement, width: number) => {
  Object.defineProperty(el, "offsetWidth", {
    configurable: true,
    value: width,
  });
};

describe("TabsBar", () => {
  it("対象パスでない場合は表示しない", () => {
    const { Wrapper } = createWrapper("/");
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.queryByText("ユーザー設定")).not.toBeInTheDocument();
  });

  it("OA 系パスでは OA タブを表示する", () => {
    const { Wrapper } = createWrapper("/OA/Users");
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.getByText("OAユーザ表示")).toBeInTheDocument();
  });

  it("管理系パスではタブを表示し、lastVisited を更新する", async () => {
    const { Wrapper, dispatchSpy } = createWrapper("/manage/User");
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.getByText("ユーザー設定")).toBeInTheDocument();

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        uiActions.setLastVisited({
          key: UrlPath.UserManage,
          path: "/manage/User",
        }),
      );
    });
  });

  it("管理配下の詳細パスでも一致判定できる", () => {
    const { Wrapper } = createWrapper("/manage/User/123");
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.getByText("ユーザー設定")).toBeInTheDocument();
  });

  it("一致しない場合は先頭タブが active になる", () => {
    const { Wrapper } = createWrapper("/manage/Unknown");
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.getByText("ユーザー設定")).toBeInTheDocument();
  });

  it("同じパスが保存済みの場合は lastVisited を更新しない", async () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper, dispatchSpy } = createWrapper("/manage/User", {
      ui: {
        ...baseUiState,
        lastVisited: {
          [UrlPath.UserManage]: "/manage/User",
        },
      },
    });
    setup(<TabsBar />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        uiActions.setLastVisited({
          key: UrlPath.UserManage,
          path: "/manage/User",
        }),
      );
    });
  });

  it("lastVisited をリンク先として使う", () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper } = createWrapper("/manage/User", {
      ui: {
        ...baseUiState,
        lastVisited: {
          [UrlPath.CenterManage]: "/manage/Center/abc",
        },
      },
    });
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "センター設定" })).toHaveAttribute(
      "href",
      "/manage/Center/abc",
    );
  });

  it("リサイズで表示数が更新され、overflow に lastVisited が反映される", async () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper } = createWrapper("/manage/User", {
      ui: {
        ...baseUiState,
        lastVisited: {
          [UrlPath.System]: "/manage/System/abc",
        },
      },
    });
    const { container } = setup(<TabsBar />, { wrapper: Wrapper });

    const inner = container.querySelector(".tabsbar-inner") as HTMLElement;
    const items = container.querySelectorAll(".tab-item");
    setElementWidth(inner, 100);
    items.forEach((el) => setElementWidth(el as HTMLElement, 60));
    await act(async () => {
      resizeCallback?.();
    });
    setElementWidth(inner, 110);
    await act(async () => {
      resizeCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("more-horizontal")).toBeInTheDocument();
    });
    const systemLinks = screen.getAllByRole("link", { name: "システム設定" });
    expect(
      systemLinks.some(
        (link) => link.getAttribute("href") === "/manage/System/abc",
      ),
    ).toBe(true);
  });
});
