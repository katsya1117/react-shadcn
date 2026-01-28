import { useEffect, useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router";
import {
  Info,
  Tag,
  User,
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  FilePenLine,
  Wrench,
  Link2,
  Settings,
  ChevronRight,
  ChevronDown,
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

type NavLinkItem = {
  label: string;
  to: string;
  icon?: React.ElementType;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  icon?: React.ElementType;
  items: NavLinkItem[];
  defaultOpen?: boolean;
};

const mainLinks: NavLinkItem[] = [
  { label: "MyPage", to: UrlPath.MyPage, exact: true, icon: User },
  { label: "JOB SEARCH", to: UrlPath.JobSearch, icon: LayoutDashboard },
  { label: "センター専用領域", to: UrlPath.ShareArea, icon: FolderKanban },
  { label: "LOG SEARCH", to: UrlPath.LogSearch, icon: ShieldCheck },
  { label: "JOB作成", to: UrlPath.JobCreate, icon: FilePenLine },
  { label: "TOOL", to: UrlPath.Tool, icon: Wrench },
];

const groups: NavGroup[] = [
  {
    label: "OA連携",
    icon: Link2,
    items: [
      { label: "OAユーザ表示", to: UrlPath.OAUsers },
      { label: "OA工番情報", to: UrlPath.OAOrders },
    ],
    defaultOpen: false,
  },
  {
    label: "管理",
    icon: Settings,
    items: [
      { label: "ユーザー設定", to: UrlPath.UserManage },
      { label: "センター設定", to: UrlPath.CenterManage },
      { label: "アクセスユーザー設定", to: UrlPath.ManageRole },
      { label: "お知らせ設定", to: UrlPath.Information },
      { label: "システム設定", to: UrlPath.System },
      { label: "ユーザー設定状況", to: UrlPath.UserSetting },
      { label: "バッチステータス", to: UrlPath.Batch },
    ],
    defaultOpen: true,
  },
];

const isActivePath = (current: string, target: string, exact?: boolean) =>
  exact ? current === target : current.startsWith(target);

const SideMenu = () => {
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(
    groups.find((g) => g.defaultOpen)?.label ?? null,
  );
  const loginUser = useSelector(userSelector.loginUserSelector());
  const activePath = location.pathname;

  return (
    <aside className="w-[240px] min-w-[220px] border-r bg-background/80 backdrop-blur-sm flex flex-col h-screen">
      <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">Ops Console</div>
          <div className="text-xs text-muted-foreground">ナビゲーション</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Information"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <Info size={16} />
          </button>
          <button
            type="button"
            aria-label="Version"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <Tag size={16} />
          </button>
        </div>
      </div>

      <nav className="p-3 space-y-6 text-sm flex-1 overflow-auto">
        <div className="space-y-1">
          {[...mainLinks, ...groups.map((g) => ({ ...g, isGroup: true }))].map((entry) => {
            const Icon = (entry as any).icon as React.ElementType | undefined;
            const isGroup = (entry as any).isGroup;
            const opened = isGroup && openGroup === entry.label;
            const hasActive =
              isGroup && (entry as NavGroup).items.some((i) => isActivePath(activePath, i.to, i.exact));
            if (isGroup) {
              return (
                <div key={entry.label} className="space-y-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 px-3 py-2 text-left text-muted-foreground font-normal hover:text-foreground",
                      hasActive && "bg-muted text-foreground font-medium",
                    )}
                    onClick={() => setOpenGroup(opened ? null : entry.label)}
                  >
                    {Icon && <Icon size={16} className="text-muted-foreground" />}
                    <span className="flex-1 text-left">{entry.label}</span>
                    {opened ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </Button>
                  {opened && (
                    <div className="space-y-1 pl-2 border-l border-border/70">
                      {(entry as NavGroup).items.map((item) => (
                        <RouterNavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted text-left",
                              isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground",
                            )
                          }
                          end={item.exact}
                        >
                          <span>{item.label}</span>
                        </RouterNavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <RouterNavLink
                key={entry.to}
                to={entry.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted text-left",
                    isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground",
                  )
                }
                end={entry.exact}
              >
                {Icon && <Icon size={16} className="text-muted-foreground" />}
                <span>{entry.label}</span>
              </RouterNavLink>
            );
          })}
        </div>
      </nav>
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-3">
              <span className="truncate">
                {loginUser?.user?.disp_name ?? loginUser?.user?.user_cd ?? "guest"}
              </span>
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
