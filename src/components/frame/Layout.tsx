// import type { PropsWithChildren } from "react";
// import { LayoutStyle } from "./LayoutStyle.css";
// import { TopMenu } from "./TopMenu";

// const Layout = ({ children }: PropsWithChildren) => (
//   <div className={LayoutStyle.container}>
//     <TopMenu />
//     <div className={LayoutStyle.contents}>{children}</div>
//   </div>
// );

// export default Layout;

// ここから、サイドメニュー案v1
// import type { PropsWithChildren } from "react";
// import { LayoutStyleForSide } from "./LayoutStyleforSide.css";
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


// ここから、サイドメニュー案v2

import type { PropsWithChildren } from "react";
import SideMenuv2 from "./SideMenuv2";
import SideHeaderv2 from "./SideHeaderv2";
import SideTabsBarv2 from "./SideTabsBarv2";

/**
 * Side navigation layout with a global top header.
 * OA連携 / 管理 配下のページではコンテンツ上部にタブを表示する。
 */
const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div
      className="min-h-screen w-full text-foreground flex flex-col"
      style={{ background: "linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9)" }}
    >
      {/* Global header spanning sidebar + content */}
      <SideHeaderv2 />

      {/* Body */}
      <div className="flex w-full min-h-0 flex-1">
        <SideMenuv2 />
        <main className="flex-1 min-h-0 overflow-auto w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SideTabsBarv2 />
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
