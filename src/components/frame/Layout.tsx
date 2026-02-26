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
import { userSelector } from "@/redux/slices/userSlice";
import type { AppDispatch } from "../../redux/store";
import { useDispatch } from "react-redux";
import SimpleSingleSignOn from "../parts/SimpleSingleSignOn/SimpleSingleSignOn";

/**
 * Side navigation layout with a global top header.
 * OA連携 / 管理 配下のページではコンテンツ上部にタブを表示する。
 */
type LayoutProps = PropsWithChildren<{ isHide?: boolean }>;

export const Layout = ({ children, isHide }: LayoutProps) => {
  const inLogin = useSelector(userSelector.isLoginSelector());
  const isCollapsed = useSelector(uiSelector.isSideMenuCollapsed);
  const dispatch: AppDispatch = useDispatch();

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
      <SimpleSingleSignOn />
      {isLogin && (
        <>
          {!isHide && (
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
              !isHide &&
                (isCollapsed
                  ? layoutBodyWithMenuCollapsed
                  : layoutBodyWithMenuExpanded),
            )}
          >
            {!isHide && <Header />}
            {!isHide && <TabsBar />}
            <main className={mainArea}>{children}</main>
          </div>
        </>
      )}
    </div>
  );
};
