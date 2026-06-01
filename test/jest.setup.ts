import "@testing-library/jest-dom";
import { jest } from "@jest/globals";
import { TextDecoder, TextEncoder } from "util";

/* eslint-disable @typescript-eslint/no-explicit-any */
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// jsdom does not implement scrollTo
Element.prototype.scrollTo = jest.fn() as unknown as typeof Element.prototype.scrollTo;

// jsdom does not implement ResizeObserver
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock("@vanilla-extract/css", () => ({
  style: () => "",
  styleVariants: () => ({}),
  globalStyle: () => {},
  createVar: () => "",
  fallbackVar: (...args: string[]) => args[args.length - 1],
  assignVars: () => ({}),
}));

// NOTE: react-router, tabs, sonner, AutoCompleteMulti, Pagination are mocked via moduleNameMapper in jest.config.ts
/* eslint-enable @typescript-eslint/no-explicit-any */
