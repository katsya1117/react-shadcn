import { style } from "@vanilla-extract/css";

export const TabsBarStyle = {
  container: style({
    width: "100%",
    position: "sticky",
    top: "56px", // header height (h-14)
    zIndex: 30,
    marginBottom: "0.75rem", // ~12px
    background: "var(--background)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    paddingTop: "0.25rem",
  }),
  inner: style({
    width: "100%",
    margin: "0 auto",
    padding: "0",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
  }),
};
