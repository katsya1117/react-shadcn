import { useState, useEffect } from "react";
import { useLocation, NavLink as RouterNavLink } from "react-router";
import {
  Home,
  Search,
  Database,
  FileSearch,
  FilePlus2,
  Wrench,
  Cloud,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UrlPath } from "@/constant/UrlPath";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { uiActions, uiSelector } from "@/redux/slices/uiSlice";
import type { LucideIcon } from "lucide-react";
import type { AppDispatch } from "../../redux/store";

type Props = {
  collapsed: boolean;
  onHandle: () => void;
};

type NavItem = {
  label: string;
  collapsedLabel: string;
  to: string;
  icon: LucideIcon;
  hasSubPages?: boolean;
  shouldRemember?: boolean;
  prefix?: string;
};

const navItems: NavItem[] = [
  { label: "MyPage", collapsedLabel: "MyPage", to: UrlPath.MyPage, icon: Home },
  {
    label: "JOB SEARCH",
    collapsedLabel: "JOB¥nSEARCH",
    to: UrlPath.JobSearch,
    icon: Search,
  },
  {
    label: "センター専用領域",
    collapsedLabel: "センター¥n専用¥n領域",
    to: UrlPath.ShareArea,
    icon: Database,
  },
  {
    label: "LOG SEARCH",
    collapsedLabel: "LOG¥nSEARCH",
    to: UrlPath.LogSearch,
    icon: FileSearch,
  },
  {
    label: "JOB作成",
    collapsedLabel: "JOB¥n作成",
    to: UrlPath.JobCreate,
    icon: FilePlus2,
  },
  { label: "TOOL", collapsedLabel: "TOOL", to: UrlPath.Tool, icon: Wrench },
  {
    label: "OA連携",
    collapsedLabel: "OA¥n連携",
    to: UrlPath.OAUsers,
    icon: Cloud,
    hasSubPages: true,
    shouldRemember: true,
    prefix: "/OA",
  },
  {
    label: "管理",
    collapsedLabel: "管理",
    to: UrlPath.UserManage,
    icon: Lock,
    hasSubPages: true,
    shouldRemember: true,
    prefix: "/manage",
  },
] as const;

const getRootPrefix = (path: string) => {
  const first = path.split("/").filter(Boolean)[0];
  return first ? `/${first}` : "/";
};

export const SideMenu = ({ collapsed, onHandle }: Props) => {
  const { pathname } = useLocation();
  const dispatch: AppDispatch = useDispatch();
  const lastVisited = useSelector(uiSelector.lastVisited);

  // ページ遷移後に現在パスを記録（直接URL遷移でも更新される）
  useEffect(() => {
    const currentPrefix = getRootPrefix(pathname);
    const isRememberTarget = navItems.some(
      (item) => item.shouldRemember && item.prefix === currentPrefix,
    );
    if (isRememberTarget) {
      if (lastVisited[currentPrefix] === pathname) return;
      dispatch(
        uiActions.setLastVisited({
          key: currentPrefix,
          path: pathname,
        }),
      );
    }
  }, [pathname, dispatch, lastVisited]);

  return (
    <aside
      className={cn(
        "border-r bg-background/85 backdrop-blur-sm flex flex-col h-screen text-[15px] transition-all duration-200 ease-out",
        collapsed ? "w-20 min-w-20" : "w-60 min-w-60",
      )}
    >
      <nav className="p-3 pb-16 space-y-2 text-[15px] flex-1 min-h-0 overflow-auto">
        <div className="flex items-center justify-between px-3 pt-1">
          <div className="text-lg font-semibold leading-tight text-foreground">
            {collapsed ? "" : "Ops Console"}
          </div>
          <button
            type="button"
            onClick={onHandle}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        {navItems.map((item) => {
          const {
            label,
            collapsedLabel,
            to,
            icon: Icon,
            hasSubPages,
            shouldRemember,
            prefix,
          } = item;
          const resolvedTo =
            (shouldRemember && prefix && lastVisited[prefix]) || to;

          return (
            <RouterNavLink
              key={to}
              to={resolvedTo}
              end={!hasSubPages}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/70 text-left",
                  isActive
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground",
                )
              }
            >
              {Icon && (
                <Icon size={18} className="shrink-0 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "truncate",
                  collapsed &&
                    "text-[11px] text-center leading-snug whitespace-pre",
                )}
              >
                {collapsed ? collapsedLabel : label}
              </span>
            </RouterNavLink>
          );
        })}
      </nav>
    </aside>
  );
};
