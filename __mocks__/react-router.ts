import { jest } from "@jest/globals";

const mockNavigate = jest.fn();

(globalThis as any).mockNavigate = mockNavigate;

export * from "react-router";
export const useNavigate = () => mockNavigate;
