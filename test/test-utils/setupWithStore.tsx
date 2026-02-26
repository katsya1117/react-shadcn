import React, { type ReactElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import {
  configureStore,
  type EnhancedStore,
  type PreloadedState,
  type ReducersMapObject,
} from "@reduxjs/toolkit";

import { setup } from "./setup";

type AnyReducers = ReducersMapObject;

type Options<S> = {
  reducers: AnyReducers;
  preloadedState?: PreloadedState<S>;
};

export const setupWithStore = (
  ui: ReactElement,
  { reducers, preloadedState }: Options<Record<string, unknown>> = {
    reducers: {},
  },
) => {
  if (!reducers || Object.keys(reducers).length === 0) {
    throw new Error("setupWithStore requires a reducers map.");
  }
  const store: EnhancedStore = configureStore({
    reducer: reducers,
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
