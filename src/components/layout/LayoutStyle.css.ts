import { style } from "@vanilla-extract/css";

export const layoutContainer = style({
  minHeight: "100vh",
  // height: "100vh",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  color: "var(--foreground)",
  // overflowY: "hidden",
});

export const layoutBody = style({
  flex: 1,
  minHeight: 0,
  width: "100%",
  minWidth: "48rem",
  display: "flex",
  flexDirection: "column",
});

export const layoutBodyStandalone = style({
  paddingLeft: 0,
});

export const mainArea = style({
  flex: 1,
  minHeight: 0,
  width: "100%",
  // 共通の最大幅（約912px）
  maxWidth: "912px",
  margin: "0 auto",
  padding: "1rem clamp(1rem, 1vw + 0.5rem, 2rem)",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
});

export const mainAreaFluid = style({
  maxWidth: "100%",
  padding: "1rem",
});

export const layoutBodyWithMenuExpanded = style({
  paddingLeft: "240px",
});

export const layoutBodyWithMenuCollapsed = style({
  paddingLeft: "72px",
});
