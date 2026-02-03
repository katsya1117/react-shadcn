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
  UserRound,
} from "lucide-react";
import { useSelector } from "react-redux";
import { UrlPath } from "@/constant/UrlPath";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userSelector } from "@/redux/slices/userSlice";

const SideMenuv2 = () => {
  const location = useLocation();
  const loginUser = useSelector(userSelector.loginUserSelector());

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

  return (
    <aside className="w-[240px] min-w-[240px] border-r bg-background/85 backdrop-blur-sm flex flex-col h-screen text-[15px]">

      <nav className="p-3 pb-16 space-y-2 text-[15px] flex-1 min-h-0 overflow-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted text-left",
                  isActive ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                )
              }
            >
              {Icon && <Icon size={18} className="text-muted-foreground" />}
              <span>{item.label}</span>
            </RouterNavLink>
          );
        })}
      </nav>

      <div className="border-t p-4 bg-background/90 backdrop-blur">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-3 gap-2">
              <div className="flex items-center gap-2 truncate">
                <UserRound size={18} className="text-muted-foreground" />
                <span className="truncate">
                  {loginUser?.user?.disp_name ?? loginUser?.user?.user_cd ?? "guest"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-full">
            <DropdownMenuItem asChild>
              <RouterNavLink to={UrlPath.MyPageEdit}>MyPage設定変更</RouterNavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <RouterNavLink to={UrlPath.UserProfile}>ユーザー情報設定変更</RouterNavLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default SideMenuv2;
