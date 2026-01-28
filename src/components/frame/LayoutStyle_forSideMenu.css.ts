import { style } from "@vanilla-extract/css";

export const LayoutStyleForSide = {
  container: style({
    width: "100%",
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9)",
    color: "var(--foreground)",
  }),
  contents: style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    padding: "1.5rem",
    boxSizing: "border-box",
    overflow: "auto",
  }),
};
