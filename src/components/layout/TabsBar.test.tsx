import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { configureStore } from "@reduxjs/toolkit";

import { TabsBar } from "./TabsBar";
import { setup } from "@test-utils";
import { uiActions, uiSliceReducer } from "@/redux/slices/uiSlice";
import { UrlPath } from "@/constants/UrlPath";

// TabsBar.css.ts / lucide-react は jest.config の mapper で固定。tabs / dropdown-menu は共有モックを使う。
jest.mock("@/components/ui/tabs");
jest.mock("@/components/ui/dropdown-menu");

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

// lucide-react は moduleNameMapper の共有モックを使う（MoreHorizontal → testid "more-horizontal"）

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

    expect(screen.getByRole("link", { name: "OAユーザ表示" })).toBeInTheDocument();
  });

  it("管理系パスではタブを表示し、tab の lastVisited を更新する", async () => {
    const { Wrapper, dispatchSpy } = createWrapper("/manage/User");
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "ユーザー設定" })).toBeInTheDocument();

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        uiActions.setLastVisitedTab({
          key: UrlPath.UserManage,
          path: "/manage/User",
        }),
      );
    });
  });

  it("管理配下の詳細パスでも一致判定できる", () => {
    const { Wrapper } = createWrapper("/manage/User/123");
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "ユーザー設定" })).toBeInTheDocument();
  });

  it("一致しない場合は先頭タブが active になる", () => {
    const { Wrapper } = createWrapper("/manage/Unknown");
    setup(<TabsBar />, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "ユーザー設定" })).toBeInTheDocument();
  });

  it("tab の lastVisited が同じ場合は更新しない", async () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper, dispatchSpy } = createWrapper("/manage/User", {
      ui: {
        ...baseUiState,
        lastVisitedTabs: {
          [UrlPath.UserManage]: "/manage/User",
        },
      },
    });
    setup(<TabsBar />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        uiActions.setLastVisitedTab({
          key: UrlPath.UserManage,
          path: "/manage/User",
        }),
      );
    });
  });

  it("tab の lastVisited をリンク先として使う", () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper } = createWrapper("/manage/User", {
      ui: {
        ...baseUiState,
        lastVisitedTabs: {
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

  it("左タブへの移動で direction を更新する", async () => {
    // System タブ（index 4）から User タブ（index 0）へ移動 → direction "left"
    const store = configureStore({ reducer: { ui: uiSliceReducer } });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={[UrlPath.System]}>{children}</MemoryRouter>
      </Provider>
    );
    setup(<TabsBar />, { wrapper: Wrapper });

    (globalThis as any).mockLocation = {
      pathname: UrlPath.UserManage,
      search: "",
      hash: "",
      state: null,
      key: "default",
    };

    // act(async) で「dispatch による state 更新 → 再描画」を完了まで進めてから検証する。
    // store.dispatch を React の外から呼ぶと、囲まないと「act でラップしろ」warning が出る。
    // （詳細は test/README.md「7. 非同期テスト」の act パターンを参照）
    await act(async () => {
      store.dispatch(
        uiActions.setLastVisitedTab({ key: UrlPath.UserManage, path: UrlPath.UserManage }),
      );
    });

    expect(screen.getByRole("link", { name: "ユーザー設定" })).toBeInTheDocument();
  });

  it("右タブへの移動で direction を更新する", async () => {
    // User タブ（index 0）から System タブ（index 4）へ移動 → direction "right"
    const store = configureStore({ reducer: { ui: uiSliceReducer } });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={[UrlPath.UserManage]}>{children}</MemoryRouter>
      </Provider>
    );
    setup(<TabsBar />, { wrapper: Wrapper });

    (globalThis as any).mockLocation = {
      pathname: UrlPath.System,
      search: "",
      hash: "",
      state: null,
      key: "default",
    };

    await act(async () => {
      store.dispatch(
        uiActions.setLastVisitedTab({ key: UrlPath.System, path: UrlPath.System }),
      );
    });

    expect(screen.getByRole("link", { name: "システム設定" })).toBeInTheDocument();
  });

  it("タブがオーバーフローしたとき overflow リストに表示される", async () => {
    const { Wrapper } = createWrapper(UrlPath.System);
    const { container } = setup(<TabsBar />, { wrapper: Wrapper });

    const inner = container.querySelector(".tabsbar-inner") as HTMLElement;
    const measureTabs = container.querySelectorAll("[data-tab-measure]");

    setElementWidth(inner, 100);
    measureTabs.forEach((el) => setElementWidth(el as HTMLElement, 60));

    // ② 操作: ResizeObserver のコールバックを手動発火（jsdom は実際の resize を起こさないため）。
    //    幅計算 → オーバーフロー判定 → 再描画 を act で完了させる。
    await act(async () => { resizeCallback?.(); });

    // ③ 待つ: オーバーフローリストに「システム設定」リンクが現れるまで
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "システム設定" })).toBeInTheDocument();
    });
  });

  it("active タブが overflow にある場合 overflow 内にリンクが表示される", async () => {
    const { Wrapper } = createWrapper(UrlPath.System);
    const { container } = setup(<TabsBar />, { wrapper: Wrapper });

    const inner = container.querySelector(".tabsbar-inner") as HTMLElement;
    const measureTabs = container.querySelectorAll("[data-tab-measure]");

    setElementWidth(inner, 100);
    measureTabs.forEach((el) => setElementWidth(el as HTMLElement, 60));

    await act(async () => { resizeCallback?.(); });

    await waitFor(() => {
      const links = screen.getAllByRole("link", { name: "システム設定" });
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it("リサイズで表示数が更新され、overflow に tab の lastVisited が反映される", async () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper } = createWrapper("/manage/User", {
      ui: {
        ...baseUiState,
        lastVisitedTabs: {
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
