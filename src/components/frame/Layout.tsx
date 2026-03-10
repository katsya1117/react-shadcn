import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { SideMenu } from "./SideMenu";
import { Header, type HeaderProps } from "./Header";
import { TabsBar } from "./TabsBar";
import {
  layoutContainer,
  layoutBody,
  layoutBodyWithMenuCollapsed,
  layoutBodyWithMenuExpanded,
  mainArea,
  layoutBodyStandalone,
  mainAreaFluid,
} from "./LayoutStyle.css";
import { cn } from "@/lib/utils";
import { userSelector } from "@/redux/slices/userSlice";
import type { AppDispatch } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import SimpleSingleSignOn from "../parts/SimpleSingleSignOn/SimpleSingleSignOn";
import { uiActions, uiSelector } from "@/redux/slices/uiSlice";

/**
 * Side navigation layout with a global top header.
 * OA連携 / 管理 配下のページではコンテンツ上部にタブを表示する。
 */
type LayoutProps = PropsWithChildren<{
  hideSideMenu?: boolean;
  hideHeader?: boolean;
  hideTabs?: boolean;
  fluid?: boolean;
  /** Header コンポーネントへの props */
  headerProps?: HeaderProps;
}>;

export const Layout = ({
  children,
  hideSideMenu,
  hideHeader,
  hideTabs,
  fluid,
  headerProps,
}: LayoutProps) => {
  const isLogin = useSelector(userSelector.isLoginSelector());
  const isCollapsed = useSelector(uiSelector.isSideMenuCollapsed);
  const dispatch: AppDispatch = useDispatch();
  // NOTE: リリース時はログイン状態に応じて表示制御する
  // const showFrame = isLogin || import.meta.env.DEV;

  // サイドバー幅に合わせてトースト位置のオフセットを更新
  // useEffect(() => {
  //   const offset = collapsed ? 36 : 120; // 72/2 or 240/2
  //   document.documentElement.style.setProperty(
  //     "--sidebar-offset",
  //     `${offset}px`,
  //   );
  // }, [collapsed]);

  return (
    <div className={layoutContainer}>
      {/* <SimpleSingleSignOn /> */}
      {!hideSideMenu && (
        <div className="fixed inset-y-0 left-0 z-50">
          <SideMenu
            collapsed={isCollapsed}
            onHandle={() => dispatch(uiActions.toggleSideMenu())}
          />
        </div>
      )}

      <div
        className={cn(
          layoutBody,
          hideSideMenu
            ? layoutBodyStandalone
            : isCollapsed
              ? layoutBodyWithMenuCollapsed
              : layoutBodyWithMenuExpanded,
        )}
      >
        {!hideHeader && <Header {...headerProps} />}
        {!hideTabs && <TabsBar />}
        <main className={cn(mainArea, fluid && mainAreaFluid)}>{children}</main>
      </div>
    </div>
  );
};
