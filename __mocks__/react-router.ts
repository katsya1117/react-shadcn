import { jest } from "@jest/globals";

const mockNavigate = jest.fn();
(globalThis as any).mockNavigate = mockNavigate;
(globalThis as any).mockParams = {} as Record<string, string>;

export * from "react-router";
export const useNavigate = () => mockNavigate;
export const useParams = () => (globalThis as any).mockParams ?? {};
