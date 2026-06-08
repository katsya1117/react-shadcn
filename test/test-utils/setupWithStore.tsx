import { type ReactElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import {
  configureStore,
  combineReducers,
  type Reducer,
  type ReducersMapObject,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { jest } from "@jest/globals";

import { setup } from "./setup";

type Options<S> = {
  /** スライス名 → reducer の対応表。テスト対象が読むスライスだけ渡せばよい。 */
  reducers: ReducersMapObject<S, UnknownAction>;
  /** スライスごとの初期状態。渡したスライスだけ上書きできる。 */
  preloadedState?: Partial<S>;
};

/**
 * Redux ストアと Router を備えた状態で UI をレンダリングするヘルパー。
 * - 渡した reducers から本物のストアを組み立てる（reducer はモックしない）
 * - dispatch を spy 化し、呼ばれた action を検証できるようにする
 *
 * 戻り値は setup() の結果（user / screen クエリ）に { store, dispatchSpy } を足したもの。
 *
 * @example
 * const { user, dispatchSpy } = setupWithStore(<UserEdit />, {
 *   reducers: { user: userSliceReducer },
 *   preloadedState: { user: { isLogin: true } },
 * });
 */
export const setupWithStore = <S extends Record<string, unknown>>(
  ui: ReactElement,
  { reducers, preloadedState }: Options<S>,
) => {
  // combineReducers の戻り値は configureStore が要求する厳密な型と一致しないため、
  // 「preloadedState に Partial<S> を渡せる Reducer<S>」として型を合わせる。
  const rootReducer = combineReducers(reducers) as unknown as Reducer<
    S,
    UnknownAction,
    Partial<S>
  >;

  const store = configureStore({ reducer: rootReducer, preloadedState });
  const dispatchSpy = jest.spyOn(store, "dispatch");

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );

  return { ...setup(ui, { wrapper: Wrapper }), store, dispatchSpy };
};
