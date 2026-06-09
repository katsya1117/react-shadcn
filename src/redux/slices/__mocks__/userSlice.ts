import { jest } from "@jest/globals";

// reducer / selector / actions は実体をそのまま使い、thunk だけ jest.fn() に差し替える。
// jest.mock() は「解決後パス」でモックを張るため、ここで `from "../userSlice"` を再 export すると
// 自分自身に解決して無限ループになる。実体取得は必ず jest.requireActual を使う。
const actual = jest.requireActual(
  "../userSlice",
) as typeof import("../userSlice");

export const initialState = actual.initialState;
export const userActions = actual.userActions;
export const userSelector = actual.userSelector;
export const boxSelector = actual.boxSelector;
export const userSliceReducer = actual.userSliceReducer;
export type { UserSearchParamsExt } from "../userSlice";

// Thunks mocked as jest.fn() returning plain action objects
export const getLoginUserInfo = jest.fn((arg?: unknown) => ({
  type: "getLoginUserInfo",
  payload: arg,
}));

export const getUserList = jest.fn((arg: unknown) => ({
  type: "getUserList",
  payload: arg,
}));

export const getUserInfo = jest.fn((arg: unknown) => ({
  type: "getUserInfo",
  payload: arg,
}));

const updateUserInfoMock = jest.fn((arg: unknown) => ({
  type: "updateUserInfo",
  payload: arg,
}));
(updateUserInfoMock as any).fulfilled = {
  match: (action: any) => action?.type === "updateUserInfo/fulfilled",
};
export const updateUserInfo = updateUserInfoMock;

export const getAdUserList = jest.fn((arg: unknown) => ({
  type: "getAdUserList",
  payload: arg,
}));

const userCreationMock = jest.fn((arg: unknown) => ({
  type: "userCreation",
  meta: { arg },
}));
(userCreationMock as any).fulfilled = {
  match: (action: any) => action?.type === "userCreation",
};
export const userCreation = userCreationMock;

const removeUserMock = jest.fn((arg: unknown) => ({
  type: "removeUser",
  payload: arg,
}));
(removeUserMock as any).fulfilled = {
  match: (action: any) => action?.type === "removeUser/fulfilled",
};
export const removeUser = removeUserMock;

export const getBoxAccountId = jest.fn((arg?: unknown) => ({
  type: "getBoxAccountId",
  payload: arg,
}));

export const getBoxAccessToken = jest.fn((arg?: unknown) => ({
  type: "getBoxAccessToken",
  payload: arg,
}));

export const getPermissionList = jest.fn((arg?: unknown) => ({
  type: "getPermissionList",
  payload: arg,
}));
