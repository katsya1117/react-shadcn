import { jest } from "@jest/globals";

// 実体（slice / selector / reducer）はそのまま使い、thunk だけ差し替える。
// jest.requireActual を使わないと自分自身に解決して無限ループになる。
const actual = jest.requireActual(
  "../permissionSlice",
) as typeof import("../permissionSlice");

export const permissionSlice = actual.permissionSlice;
export const permissionSelector = actual.permissionSelector;
export const permissionReducer = actual.permissionReducer;

export const getPermissionList = jest.fn(() => ({
  type: "getPermissionList",
}));
