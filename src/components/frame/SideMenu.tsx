import { useEffect } from "react";
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
  className?: string;
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
    hasSubPages: true,
    shouldRemember: true,
    prefix: UrlPath.ShareArea,
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

export const SideMenu = ({ collapsed, onHandle, className }: Props) => {
  const { pathname, search } = useLocation();
  const dispatch: AppDispatch = useDispatch();
  const lastVisitedSections = useSelector(uiSelector.lastVisitedSections);

  // ページ遷移後に現在パスを記録（直接URL遷移でも更新される）
  useEffect(() => {
    const rememberTarget = navItems.find(
      (item) => item.shouldRemember && item.prefix && pathname.startsWith(item.prefix),
    );

    if (rememberTarget?.prefix) {
      const currentPath = `${pathname}${search}`;
      if (lastVisitedSections[rememberTarget.prefix] === currentPath) return;
      dispatch(
        uiActions.setLastVisitedSection({
          key: rememberTarget.prefix,
          path: currentPath,
        }),
      );
    }
  }, [pathname, search, dispatch, lastVisitedSections]);

  return (
    <aside
      className={cn(
        "border-r border-sidebar-border bg-sidebar flex flex-col h-screen text-[15px] transition-all duration-200 ease-out",
        collapsed ? "w-20 min-w-20" : "w-60 min-w-60",
        className,
      )}
    >
      <nav className="p-3 pb-16 space-y-1 text-[15px] flex-1 min-h-0 overflow-auto">
        {/* ロゴ/タイトルエリア - ブランドカラーでアクセント */}
        <div className="flex items-center justify-between px-3 py-4 mb-3">
          <div className="flex items-center gap-2.5">
            {!collapsed && (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">O</span>
              </div>
            )}
            <span className="text-base font-semibold text-foreground tracking-tight">
              {collapsed ? "" : "Ops Console"}
            </span>
          </div>
          <button
            type="button"
            onClick={onHandle}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
            (shouldRemember && prefix && lastVisitedSections[prefix]) || to;

          return (
            <RouterNavLink
              key={to}
              to={resolvedTo}
              end={!hasSubPages}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-secondary text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              {Icon && <Icon size={18} className={cn("shrink-0 ml-1")} />}
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
