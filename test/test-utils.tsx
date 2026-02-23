import React, { type ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { configureStore, type EnhancedStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { userSliceReducer } from "@/redux/slices/userSlice";
import type { Pagination } from "@/api";

type UserState = ReturnType<typeof userSliceReducer>;
type StoreShape = {
  user: UserState;
};

export const createMockPagination = (
  override: Partial<Pagination> = {},
): Pagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  from: 1,
  to: 1,
  total: 1,
  first_page_url: "",
  prev_page_url: null,
  next_page_url: null,
  last_page_url: "",
  ...override,
});

export const renderWithRedux = (
  ui: ReactElement,
  { preloadedUserState = {} }: { preloadedUserState?: Partial<UserState> } = {},
) => {
  const baseUserState = userSliceReducer(undefined, { type: "@@INIT" });
  const mergedUserState = {
    ...baseUserState,
    ...(preloadedUserState ?? {}),
    list: {
      ...baseUserState.list,
      ...(preloadedUserState?.list ?? {}),
    },
    ad: {
      ...baseUserState.ad,
      ...(preloadedUserState?.ad ?? {}),
    },
  };

  const store: EnhancedStore<StoreShape> = configureStore({
    reducer: { user: userSliceReducer },
    preloadedState: { user: mergedUserState } as StoreShape,
  });
  const dispatchSpy = jest.spyOn(store, "dispatch");

  return {
    ...renderWithProviders(ui, store),
    store,
    dispatchSpy,
  };
};

const renderWithProviders = (ui: ReactElement, store: EnhancedStore<StoreShape>) =>
  render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
