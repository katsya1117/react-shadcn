import { style } from "@vanilla-extract/css";

export const LayoutStyle = {
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
  contentsHideMenu: style({
    height: "100vh",
  }),
};

// export const layoutShell =
//   style({
//     minHeight: '100vh',
//     background: 'linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9)',
//     color: 'var(--foreground)',
//   })

// export const mainArea = style({
//   margin: 'auto',
//   width: '100%',
//   maxWidth: '6xl',
//   flexDirection: 'column',
//   gap: '1.5rem',
//   padding: '1.5rem',
// })

// export const toolbarArea = style({
//   position: 'sticky',
//   top: 0,
//   zIndex: 30,
// })
