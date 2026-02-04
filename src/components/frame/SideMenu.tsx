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

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 240;

const SideMenu = ({ collapsed, onToggle }: Props) => {
  const location = useLocation();
  const navItems = [
    { label: "MyPage", to: UrlPath.MyPage, exact: true, icon: Home },
    { label: "JOB SEARCH", to: UrlPath.JobSearch, icon: Search },
    { label: "センター専用領域", to: UrlPath.ShareArea, icon: Database },
    { label: "LOG SEARCH", to: UrlPath.LogSearch, icon: FileSearch },
    { label: "JOB作成", to: UrlPath.JobCreate, icon: FilePlus2 },
    { label: "TOOL", to: UrlPath.Tool, icon: Wrench },
    { label: "OA連携", to: UrlPath.OAUsers, icon: Cloud },
    { label: "管理", to: UrlPath.UserManage, icon: Lock },
  ] as const;

  const isSectionActive = (to: string) => {
    if (to.startsWith("/OA/") && location.pathname.startsWith("/OA/")) return true;
    if (to.startsWith("/manage/") && location.pathname.startsWith("/manage/")) return true;
    return false;
  };

  return (
    <aside
      className={cn(
        "border-r bg-background/85 backdrop-blur-sm flex flex-col h-screen text-[15px] transition-all duration-200 ease-out",
        collapsed ? "w-[72px] min-w-[72px]" : "w-[240px] min-w-[240px]"
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
        {!collapsed && <div className="px-3 pb-1 text-xs text-muted-foreground">ナビゲーション</div>}
        {navItems.map((item) => {
          const Icon = item.icon;
          const short = item.label.slice(0, 2);
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted text-left",
                  isActive || isSectionActive(item.to)
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground"
                )
              }
            >
              {Icon && <Icon size={18} className="text-muted-foreground" />}
              <span className={cn("truncate", collapsed && "text-[11px] leading-none")}>
                {collapsed ? short : item.label}
              </span>
            </RouterNavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideMenu;
