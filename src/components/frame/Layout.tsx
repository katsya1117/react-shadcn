import type { PropsWithChildren } from "react";
import { LayoutStyle } from "./LayoutStyle.css";
import SideMenu from "./SideMenu";

const Layout = ({ children }: PropsWithChildren) => (
  <div className={LayoutStyle.container}>
    <div className="flex h-screen">
      <SideMenu />
      <div className={LayoutStyle.contents}>{children}</div>
    </div>
  </div>
);

export default Layout;
