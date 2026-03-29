import type { RoleType } from "./types";

export const DISPLAY_PATH_ROOT = "\\share\\";
export const DEFAULT_ROLE: RoleType = "viewer";
export const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];
