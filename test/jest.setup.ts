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

// jsdom does not implement navigator.clipboard (SecureContext only)
Object.defineProperty(global.navigator, "clipboard", {
  value: { writeText: jest.fn(), readText: jest.fn() },
  writable: true,
  configurable: true,
});

// このファイルは jsdom のポリフィルだけを置く。
// モジュールの差し替え（react-router / lucide-react / @vanilla-extract/css 等）は
// jest.config.ts の moduleNameMapper に集約している。
/* eslint-enable @typescript-eslint/no-explicit-any */
