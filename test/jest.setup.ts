import "@testing-library/jest-dom";
import { jest } from "@jest/globals";
import { TextDecoder, TextEncoder } from "util";

/* eslint-disable @typescript-eslint/no-explicit-any */
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

jest.mock("react-router");
jest.mock("@/components/ui/tabs");
jest.mock("@/components/common/AutoComplete/AutoCompleteMulti");
jest.mock("@/components/common/Pagination/Pagination");
/* eslint-enable @typescript-eslint/no-explicit-any */
