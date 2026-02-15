import { style } from "@vanilla-extract/css";

export const layoutContainer = style({
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  color: "var(--foreground)",
  background: "linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9)",
});

export const layoutBody = style({
  flex: 1,
  minHeight: 0,
  width: "100%",
});

export const mainArea = style({
  minHeight: 0,
  width: "100%",
  // 共通の最大幅（約912px）
  maxWidth: "912px",
  margin: "0 auto",
  padding: "1rem clamp(1rem, 1vw + 0.5rem, 2rem)",
  boxSizing: "border-box",
});

export const layoutBodyWithMenuExpanded = style({
  paddingLeft: "240px",
});

export const layoutBodyWithMenuCollapsed = style({
  paddingLeft: "72px",
});
