import { jest } from "@jest/globals";

// react-redux is CJS — jest.requireActual works
const actual = jest.requireActual("react-redux") as typeof import("react-redux");

const mockDispatch = jest.fn();
(globalThis as any).mockDispatch = mockDispatch;

export const useDispatch = () => mockDispatch;
export const useSelector = jest.fn();

// Re-export everything else from real react-redux
export const Provider = actual.Provider;
export const connect = actual.connect;
export const configureStore = (actual as any).configureStore;
export const createStore = (actual as any).createStore;
export const combineReducers = actual.combineReducers;
export const batch = actual.batch;
export const shallowEqual = actual.shallowEqual;
export const createSelectorHook = actual.createSelectorHook;
export const createDispatchHook = actual.createDispatchHook;
