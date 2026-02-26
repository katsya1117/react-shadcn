import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

/* eslint-disable @typescript-eslint/no-explicit-any */
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

jest.mock("react-router");
jest.mock("@/components/ui/tabs");
jest.mock("@/components/frame/Layout");
jest.mock("@/components/parts/AutoComplete/AutoCompleteMulti");
jest.mock("@/components/parts/Pagination/Pagination");
/* eslint-enable @typescript-eslint/no-explicit-any */
