import { jest } from "@jest/globals";

export {
  permissionSlice,
  permissionSelector,
  permissionReducer,
} from "../permissionSlice";
export type { } from "../permissionSlice";

export const getPermissionList = jest.fn((_arg?: unknown) => ({
  type: "getPermissionList",
}));
