import { useEffect, useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router";
import {
  Home,
  Search,
  Database,
  FileSearch,
  FilePlus2,
  Wrench,
  Cloud,
  Lock,
  ChevronRight,
  ChevronDown,
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
import { Information } from "../parts/Information/Information";
import { VersionInfo } from "../parts/Version/VersionInfo";

const SideMenu = () => {
  const location = useLocation();
  const [openOA, setOpenOA] = useState(false);
  const [openManage, setOpenManage] = useState(false);
  const loginUser = useSelector(userSelector.loginUserSelector());

  const navItems = [
    { label: "MyPage", to: UrlPath.MyPage, exact: true, icon: Home },
    { label: "JOB SEARCH", to: UrlPath.JobSearch, icon: Search },
    { label: "センター専用領域", to: UrlPath.ShareArea, icon: Database },
    { label: "LOG SEARCH", to: UrlPath.LogSearch, icon: FileSearch },
    { label: "JOB作成", to: UrlPath.JobCreate, icon: FilePlus2 },
    { label: "TOOL", to: UrlPath.Tool, icon: Wrench },
  ] as const;

  const oaItems = [
    { label: "OAユーザ表示", to: UrlPath.OAUsers },
    { label: "OA工番情報", to: UrlPath.OAOrders },
  ];

  const manageItems = [
    { label: "ユーザー設定", to: UrlPath.UserManage },
    { label: "センター設定", to: UrlPath.CenterManage },
    { label: "アクセスユーザー設定", to: UrlPath.ManageRole },
    { label: "お知らせ設定", to: UrlPath.Information },
    { label: "システム設定", to: UrlPath.System },
    { label: "ユーザー設定状況", to: UrlPath.UserSetting },
    { label: "バッチステータス", to: UrlPath.Batch },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  // 子ページが表示中ならツリーを自動で開いておく
  useEffect(() => {
    if (location.pathname.includes("/OA/")) {
      setOpenOA(true);
    }
    if (location.pathname.includes("/manage/")) {
      setOpenManage(true);
    }
  }, [location.pathname]);

  return (
    <aside className="w-[240px] min-w-[240px] border-r bg-background/85 backdrop-blur-sm flex flex-col h-screen text-[15px]">
      <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">Ops Console</div>
          <div className="text-xs text-muted-foreground">ナビゲーション</div>
        </div>
        <div className="flex items-center gap-1">
          <Information className="h-8 w-8 p-0" />
          <VersionInfo className="h-8 w-8 p-0" />
        </div>
      </div>

      <nav className="p-3 pb-16 space-y-4 text-[15px] flex-1 min-h-0 overflow-auto">
        <div className="space-y-2 px-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <RouterNavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/70 text-left",
                    isActive ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                  )
                }
              >
                {Icon && <Icon size={18} className="text-muted-foreground" />}
                <span>{item.label}</span>
              </RouterNavLink>
            );
          })}

          <div className="space-y-1 pt-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2 text-left text-muted-foreground font-normal hover:text-foreground",
                location.pathname.includes("/OA/") && "bg-muted text-foreground font-semibold",
              )}
              onClick={() => setOpenOA((v) => !v)}
            >
              <Cloud size={18} className="text-muted-foreground" />
              <span className="flex-1 text-left">OA連携</span>
              {openOA ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </Button>
            {openOA && (
              <div className="space-y-1 pl-3 border-l border-border/70">
                {oaItems.map((item) => (
                  <RouterNavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted text-left",
                        isActive ? "bg-muted text-foreground font-semibold" : "text-muted-foreground",
                      )
                    }
                  >
                    <span>{item.label}</span>
                  </RouterNavLink>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1 pt-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2 text-left text-muted-foreground font-normal hover:text-foreground",
                location.pathname.includes("/manage/") && "bg-muted text-foreground font-semibold",
              )}
              onClick={() => setOpenManage((v) => !v)}
            >
              <Lock size={18} className="text-muted-foreground" />
              <span className="flex-1 text-left">管理</span>
              {openManage ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </Button>
            {openManage && (
              <div className="space-y-1 pl-3 border-l border-border/70">
                {manageItems.map((item) => (
                  <RouterNavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted text-left",
                        isActive ? "bg-muted text-foreground font-semibold" : "text-muted-foreground",
                      )
                    }
                  >
                    <span>{item.label}</span>
                  </RouterNavLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="border-t p-4 sticky bottom-0 bg-background/90 backdrop-blur">
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

export default SideMenu;
