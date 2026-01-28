import type { PropsWithChildren } from "react";
import { LayoutStyleForSide } from "./LayoutStyle_forSideMenu.css";
import SideMenu from "./SideMenu";

const Layout_forSideMenu = ({ children }: PropsWithChildren) => (
  <div className={LayoutStyleForSide.container}>
    <div className="flex h-screen">
      <SideMenu />
      <div className={LayoutStyleForSide.contents}>{children}</div>
    </div>
  </div>
);

export default Layout_forSideMenu;
