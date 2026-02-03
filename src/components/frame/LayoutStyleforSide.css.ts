import { style } from "@vanilla-extract/css";

// Side menu layout (left sidebar + content)
export const LayoutStyleForSide = {
  container: style({
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    background: "linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9)",
    color: "var(--foreground)",
  }),
  contents: style({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    gap: "1.75rem",
    padding: "clamp(1.25rem, 1vw + 1rem, 2rem)",
    boxSizing: "border-box",
    overflow: "auto",
  }),
  contentsHideMenu: style({
    height: "100vh",
  }),
};
