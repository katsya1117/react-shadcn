import React from "react";
import { jest } from "@jest/globals";

const mockNavigate = jest.fn();
(globalThis as any).mockNavigate = mockNavigate;
(globalThis as any).mockParams = {} as Record<string, string>;
(globalThis as any).mockLocation = { pathname: "/", search: "", hash: "", state: null, key: "default" };

export const useNavigate = () => mockNavigate;
export const useParams = () => (globalThis as any).mockParams ?? {};
export const useLocation = () =>
  (globalThis as any).mockLocation ?? { pathname: "/", search: "", hash: "", state: null, key: "default" };
export const useSearchParams = () =>
  [new URLSearchParams(), jest.fn()] as const;

export const MemoryRouter = ({
  children,
  initialEntries,
}: {
  children?: React.ReactNode;
  initialEntries?: (string | { pathname?: string; search?: string; state?: unknown })[];
}) => {
  if (initialEntries) {
    const entry = initialEntries[0] ?? "/";
    const pathname = typeof entry === "string" ? entry : (entry.pathname ?? "/");
    const search = typeof entry === "string" ? "" : (entry.search ?? "");
    const state = typeof entry === "string" ? null : (entry.state ?? null);
    (globalThis as any).mockLocation = { pathname, search, hash: "", state, key: "default" };
  }
  return React.createElement(React.Fragment, null, children);
};

export const Link = ({
  children,
  to,
  ...rest
}: {
  children?: React.ReactNode;
  to: string;
  [key: string]: any;
}) => React.createElement("a", { href: to, ...rest }, children);

export const NavLink = Link;

// Simple path matching — converts route pattern to regex
function matchPath(pattern: string, pathname: string): boolean {
  const regexStr = "^" + pattern.replace(/:[^/]+/g, "[^/]+").replace(/\*/g, ".*") + "(/|$)";
  return new RegExp(regexStr).test(pathname);
}

export const Routes = ({ children }: { children?: React.ReactNode }) => {
  const location = (globalThis as any).mockLocation ?? { pathname: "/" };
  const childArray = React.Children.toArray(children);
  for (const child of childArray) {
    if (React.isValidElement(child) && (child as any).props?.path) {
      const { path, element } = (child as any).props;
      if (matchPath(path, location.pathname)) {
        return React.createElement(React.Fragment, null, element);
      }
    }
  }
  return null;
};

export const Route = (_props: {
  path?: string;
  element?: React.ReactNode;
  children?: React.ReactNode;
}) => null;

export const Navigate = ({ to }: { to: string }) => {
  (globalThis as any).mockLocation = { pathname: to, search: "", hash: "", state: null, key: "default" };
  return null;
};

export const Outlet = () => null;

export const redirect = (url: string) =>
  new Response(null, { headers: { Location: url }, status: 302 });

export const createMemoryRouter = jest.fn();
