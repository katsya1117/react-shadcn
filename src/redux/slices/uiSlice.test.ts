import { uiActions, uiSelector, uiSliceReducer } from "./uiSlice";

describe("uiSlice", () => {
  it("toggleSideMenu で状態が反転する", () => {
    const state1 = uiSliceReducer(undefined, uiActions.toggleSideMenu());
    expect(state1.isSideMenuCollapsed).toBe(true);

    const state2 = uiSliceReducer(state1, uiActions.toggleSideMenu());
    expect(state2.isSideMenuCollapsed).toBe(false);
  });

  it("setLastVisited で path を保存する", () => {
    const next = uiSliceReducer(
      undefined,
      uiActions.setLastVisited({ key: "/manage", path: "/manage/User" }),
    );

    expect(next.lastVisited["/manage"]).toBe("/manage/User");
  });

  it("setSideMenuCollapsed で状態を指定できる", () => {
    const next = uiSliceReducer(undefined, uiActions.setSideMenuCollapsed(true));

    expect(next.isSideMenuCollapsed).toBe(true);
  });

  it("selectors で値を取得できる", () => {
    const state = uiSliceReducer(undefined, uiActions.toggleSideMenu());
    const root = { ui: state } as any;

    expect(uiSelector.isSideMenuCollapsed(root)).toBe(true);
    expect(uiSelector.lastVisited(root)).toEqual({});
  });
});
