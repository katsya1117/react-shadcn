import { type ReactElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import {
  configureStore,
  combineReducers, // 👈 追加
  type Reducer, // 👈 追加
  type ReducersMapObject,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { jest } from "@jest/globals";

import { setup } from "./setup";

type Options<S> = {
  reducers: ReducersMapObject<S, UnknownAction>;
  preloadedState?: Partial<S>;
};

export const setupWithStore = <S extends Record<string, unknown>>(
  ui: ReactElement,
  { reducers, preloadedState }: Options<S>,
) => {
  if (Object.keys(reducers).length === 0) {
    throw new Error("setupWithStore requires at least one reducer.");
  }

  // 💡 解決の要（カナメ）
  // 1. combineReducers を使ってオブジェクトから単一の Reducer 関数に変換する
  // 2. ESLint に怒られない `unknown` を経由して、configureStore が求める「第3引数が Partial<S> の Reducer」に型をピタッと合わせる
  const rootReducer = combineReducers(reducers) as unknown as Reducer<
    S,
    UnknownAction,
    Partial<S>
  >;

  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
  });

  const dispatchSpy = jest.spyOn(store, "dispatch");

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );

  return {
    ...setup(ui, { wrapper: Wrapper }),
    store,
    dispatchSpy,
  };
};
