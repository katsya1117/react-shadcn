import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { configureStore } from "@reduxjs/toolkit";

import { SideMenu } from "./SideMenu";
import { setup } from "@test-utils";
import { uiActions, uiSliceReducer } from "@/redux/slices/uiSlice";

// lucide-react は moduleNameMapper の共有モックを使う（このテストはアイコンの testid を参照しない）

// 非同期テストの読み方は test/README.md「7. 非同期テスト」を参照。
// このファイルの await waitFor は「マウント時 useEffect → dispatch（最後に訪れたセクション記録など）」
// という副作用が走るのを待つためのもの。dispatchSpy で「dispatch されたか / されないか」を検証する。

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

  it("管理配下では section の lastVisited を更新する", async () => {
    const { Wrapper, dispatchSpy } = createWrapper("/manage/User");
    setup(<SideMenu collapsed={false} onHandle={jest.fn()} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        uiActions.setLastVisitedSection({
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

  it("section の lastVisited が同じ場合は更新しない", async () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper, dispatchSpy } = createWrapper("/manage/User", {
      ui: {
        ...baseUiState,
        lastVisitedSections: {
          "/manage": "/manage/User",
        },
      },
    });
    setup(<SideMenu collapsed={false} onHandle={jest.fn()} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        uiActions.setLastVisitedSection({
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

  it("section の lastVisited をリンク先として使う", () => {
    const baseUiState = uiSliceReducer(undefined, { type: "@@INIT" });
    const { Wrapper } = createWrapper("/OA/Users", {
      ui: {
        ...baseUiState,
        lastVisitedSections: {
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
