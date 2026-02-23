import "@testing-library/jest-dom";
import React from "react";
import { TextDecoder, TextEncoder } from "util";
import { AutoCompleteMulti } from "./mocks/AutoCompleteMultiMock";
import { CustomPagination } from "./mocks/PaginationMock";
import LayoutMock from "./mocks/LayoutMock";
import { Tabs, TabsList, TabsTrigger } from "./mocks/TabsMock";

/* eslint-disable @typescript-eslint/no-explicit-any */
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// 1. useNavigate のモック
(global as any).mockNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => (global as any).mockNavigate,
}));

// 2. Tabs のモック (ここを確実な定義に変更)
jest.mock("@/components/ui/tabs", () => ({
  __esModule: true,
  Tabs,
  TabsList,
  TabsTrigger,
}));

// 3. Layout のモック (デフォルトエクスポートを確実に定義)
jest.mock("@/components/frame/Layout", () => ({
  __esModule: true,
  default: LayoutMock,
}));

// 4. AutoCompleteMulti / Pagination を共通モック
jest.mock("@/components/parts/AutoComplete/AutoCompleteMulti", () => ({
  __esModule: true,
  AutoCompleteMulti,
}));

jest.mock("@/components/parts/Pagination/Pagination", () => ({
  __esModule: true,
  CustomPagination,
}));
/* eslint-enable @typescript-eslint/no-explicit-any */
