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
  const lastVisited = useSelector(uiSelector.lastVisited);

  // ページ遷移後に現在パスを記録（直接URL遷移でも更新される）
  useEffect(() => {
    const rememberTarget = navItems.find(
      (item) => item.shouldRemember && item.prefix && pathname.startsWith(item.prefix),
    );

    if (rememberTarget?.prefix) {
      const currentPath = `${pathname}${search}`;
      if (lastVisited[rememberTarget.prefix] === currentPath) return;
      dispatch(
        uiActions.setLastVisited({
          key: rememberTarget.prefix,
          path: currentPath,
        }),
      );
    }
  }, [pathname, search, dispatch, lastVisited]);

  return (
    <aside
      className={cn(
        "border-r bg-background/85 backdrop-blur-sm flex flex-col h-screen text-[15px] transition-all duration-200 ease-out",
        collapsed ? "w-20 min-w-20" : "w-60 min-w-60",
        className,
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[color:var(--brand-soft)]",
                  isActive
                    ? "bg-[color:var(--brand-soft)] text-[color:var(--brand)] font-semibold"
                    : "text-muted-foreground",
                )
              }
            >
              {Icon && <Icon size={18} className="shrink-0" />}
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
