import type { PropsWithChildren } from 'react'
import { LayoutStyle } from './LayoutStyle.css'
import TopMenu from './TopMenu'

const Layout = ({ children }: PropsWithChildren) => (
  <div className={LayoutStyle.container}>
    <TopMenu />
    <div className={LayoutStyle.contents}>{children}</div>
  </div>
)

export default Layout

// import type { PropsWithChildren } from "react";
// import { Layout } from "./LayoutStyle.css";
// import SideMenu from "./SideMenu";

// const Layout = ({ children }: PropsWithChildren) => (
//   <div className={LayoutStyleForSide.container}>
//     <div className="flex h-screen">
//       <SideMenu />
//       <div className={LayoutStyleForSide.contents}>{children}</div>
//     </div>
//   </div>
// );

// export default Layout;
