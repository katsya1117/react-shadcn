import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";
import { Header } from "./Header";
import TabsBar from "./TabsBar";
import {
  layoutContainer,
  layoutBody,
  layoutBodyWithMenuCollapsed,
  layoutBodyWithMenuExpanded,
  mainArea,
} from "./LayoutStyle.css";
import { cn } from "@/lib/utils";

/**
 * Side navigation layout with a global top header.
 * OA連携 / 管理 配下のページではコンテンツ上部にタブを表示する。
 */
type LayoutProps = PropsWithChildren<{ isHide?: boolean }>;

const Layout = ({ children, isHide }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  // サイドバー幅に合わせてトースト位置のオフセットを更新
  useEffect(() => {
    const offset = collapsed ? 36 : 120; // 72/2 or 240/2
    document.documentElement.style.setProperty(
      "--sidebar-offset",
      `${offset}px`,
    );
  }, [collapsed]);

  return (
    <div className={layoutContainer}>
      {!isHide && (
        <div className="fixed inset-y-0 left-0 z-50">
          <SideMenu
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
          />
        </div>
      )}

      <div
        className={cn(
          layoutBody,
          !isHide &&
            (collapsed
              ? layoutBodyWithMenuCollapsed
              : layoutBodyWithMenuExpanded),
        )}
      >
        {!isHide && <Header />}
        {!isHide && <TabsBar />}
        <main className={mainArea}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
