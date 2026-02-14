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
import { navActions, navSelector } from "@/redux/slices/navSlice";
import type { LucideIcon } from "lucide-react";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  hasSubPages?: boolean;
  shouldRemember?: boolean;
  prefix?:string
};

const navItems: NavItem[] = [
  { label: "MyPage", to: UrlPath.MyPage, icon: Home},
  { label: "JOB SEARCH", to: UrlPath.JobSearch, icon: Search },
  { label: "センター専用領域", to: UrlPath.ShareArea, icon: Database },
  { label: "LOG SEARCH", to: UrlPath.LogSearch, icon: FileSearch },
  { label: "JOB作成", to: UrlPath.JobCreate, icon: FilePlus2 },
  { label: "TOOL", to: UrlPath.Tool, icon: Wrench },
  {
    label: "OA連携",
    to: UrlPath.OAUsers,
    icon: Cloud,
    hasSubPages: true,
    shouldRemember: true,
    prefix: "/OA"
  },
  {
    label: "管理",
    to: UrlPath.UserManage,
    icon: Lock,
    hasSubPages: true,
    shouldRemember: true,
    prefix: "/manage"
  },
];

const getRootPrefix = (path: string) => {
  const first = path.split("/").filter(Boolean)[0];
  return first ? `/${first}` : "/";
};

const SideMenu = ({ collapsed, onToggle }: Props) => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const lastVisited = useSelector(navSelector.lastVisitedSelector());

  // ページ遷移後に現在パスを記録（直接URL遷移でも更新される）
  useEffect(() => {
    const currentPrefix = getRootPrefix(pathname);
    const isRememberTarget = navItems.some(
      (item) => item.shouldRemember && item.prefix === currentPrefix
    );
    if (isRememberTarget) {
      dispatch(navActions.setLastVisited({ key: currentPrefix, path: pathname }));
    }
  }, [pathname, dispatch]);

  return (
    <aside
      className={cn(
        "border-r bg-background/85 backdrop-blur-sm flex flex-col h-screen text-[15px] transition-all duration-200 ease-out",
        collapsed ? "w-[72px] min-w-[72px]" : "w-[240px] min-w-[240px]",
      )}
    >
      <nav className="p-3 pb-16 space-y-2 text-[15px] flex-1 min-h-0 overflow-auto">
        <div className="flex items-center justify-between px-3 pt-1">
          <div className="text-lg font-semibold leading-tight text-foreground">
            {collapsed ? "OC" : "Ops Console"}
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        {!collapsed && (
          <div className="px-3 pb-1 text-xs text-muted-foreground">
            ナビゲーション
          </div>
        )}
        {navItems.map((item) => {
          const { label, to, icon:Icon, hasSubPages, shouldRemember, prefix } = item;
          const resolvedTo = (shouldRemember && prefix && lastVisited[prefix]) || to;

          return (
            <RouterNavLink
              key={to}
              to={resolvedTo}
              end={!hasSubPages}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted text-left",
                  isActive
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground",
                )
              }
            >
              <Icon size={18} className="shrink-0 text-muted-foreground" />
              <span
                className={cn(
                  "truncate",
                  collapsed && "text-[11px] leading-none",
                )}
              >
                {label}
              </span>
            </RouterNavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideMenu;
