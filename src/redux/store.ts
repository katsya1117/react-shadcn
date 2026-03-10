import type { RootState, AppDispatch as StoreAppDispatch } from "@/store";

// アプリ全体の State 型を redux 配下から参照できるようにするための薄いラッパー
export type AppRootState = RootState;
export type AppDispatch = StoreAppDispatch;
