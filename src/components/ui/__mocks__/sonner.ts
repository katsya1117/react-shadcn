import { jest } from "@jest/globals";

const toastFn = jest.fn() as jest.Mock & {
  success: jest.Mock;
  error: jest.Mock;
  warning: jest.Mock;
  info: jest.Mock;
};
toastFn.success = jest.fn();
toastFn.error = jest.fn();
toastFn.warning = jest.fn();
toastFn.info = jest.fn();

export const toast = toastFn;

export const Toaster = () => null;
