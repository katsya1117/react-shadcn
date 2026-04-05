import { uiActions, uiSelector, uiSliceReducer } from "./uiSlice";

describe("uiSlice", () => {
  it("toggleSideMenu で状態が反転する", () => {
    const state1 = uiSliceReducer(undefined, uiActions.toggleSideMenu());
    expect(state1.isSideMenuCollapsed).toBe(true);

    const state2 = uiSliceReducer(state1, uiActions.toggleSideMenu());
    expect(state2.isSideMenuCollapsed).toBe(false);
  });

  it("setLastVisitedSection で section path を保存する", () => {
    const next = uiSliceReducer(
      undefined,
      uiActions.setLastVisitedSection({ key: "/manage", path: "/manage/User" }),
    );

    expect(next.lastVisitedSections["/manage"]).toBe("/manage/User");
  });

  it("setLastVisitedTab で tab path を保存する", () => {
    const next = uiSliceReducer(
      undefined,
      uiActions.setLastVisitedTab({
        key: "/manage/User",
        path: "/manage/User/abc",
      }),
    );

    expect(next.lastVisitedTabs["/manage/User"]).toBe("/manage/User/abc");
  });

  it("setSideMenuCollapsed で状態を指定できる", () => {
    const next = uiSliceReducer(undefined, uiActions.setSideMenuCollapsed(true));

    expect(next.isSideMenuCollapsed).toBe(true);
  });

  it("selectors で値を取得できる", () => {
    const state = uiSliceReducer(undefined, uiActions.toggleSideMenu());
    const root = { ui: state } as Parameters<
      typeof uiSelector.isSideMenuCollapsed
    >[0];

    expect(uiSelector.isSideMenuCollapsed(root)).toBe(true);
    expect(uiSelector.lastVisitedSections(root)).toEqual({});
    expect(uiSelector.lastVisitedTabs(root)).toEqual({});
  });
});
