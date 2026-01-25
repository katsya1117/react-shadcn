// アイコンは一旦非表示運用のため import しない
import { useSelector } from "react-redux";
import { useLocation, NavLink as RouterNavLink } from "react-router";
import { UrlPath } from "../../constant/UrlPath";
import type { UrlPathKey } from "../../constant/UrlPath";
import { userSelector } from "../../redux/slices/userSlice";
import { Information } from "../parts/Information/Information";
import { VersionInfo } from "../parts/version/VersionInfo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { topbar, topbarInner } from "./TopMenuStyle.css";
import { useState, useEffect } from "react";

type NavItem = {
  label: string;
  key: UrlPathKey;
  iconOnly?: boolean;
  end?: boolean;
};

const navItems: NavItem[] = [
  { label: "お知らせ", key: "notifications", iconOnly: true },
  { label: "MyPage", key: "mypage" },
  { label: "JOB SEARCH", key: "jobSearch", end: true },
  { label: "センター専用領域", key: "center" },
  { label: "LOG SEARCH", key: "logSearch" },
  { label: "JOB作成", key: "jobCreate" },
  { label: "TOOL", key: "tool" },
  { label: "OA連携", key: "oa" },
  { label: "管理", key: "admin" },
  { label: "ヘルプ", key: "help", iconOnly: true },
];

const TopMenu = () => {
  const loginUser = useSelector(userSelector.loginUserSelector());
  const [anchorOA, setAnchorOA] = useState(false);
  const [anchorManage, setAnchorManage] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("/OA/")) {
      setAnchorOA(true);
    } else {
      setAnchorOA(false);
    }
    if (location.pathname.includes("/manage/")) {
      setAnchorManage(true);
    } else {
      setAnchorManage(false);
    }
    // user領域は今回のナビには未使用のためフラグも未使用
  }, [location]);

  return (
    <>
      <div className={topbar}>
        <div className={topbarInner}>
          <div className="flex items-center gap-3 min-w-0 flex-nowrap">
            <button
              className="flex items-center gap-2 font-semibold text-lg shrink-0"
              // onClick={() => navigate('/')}
              aria-label="Go to dashboard"
              type="button"
            >
              <span>Ops Console</span>
              <Badge variant="outline" className="hidden sm:inline-flex">
                Mock
              </Badge>
            </button>
            <NavigationMenu>
              <NavigationMenuList className="flex items-center gap-1">
                <NavigationMenuItem>
                  <Information />
                </NavigationMenuItem>
                {navItems
                  .filter((item) => !item.iconOnly && item.key !== 'oa' && item.key !== 'admin')
                  .map((item) => (
                    <NavigationMenuItem key={item.key}>
                      <NavigationMenuLink asChild active={location.pathname === UrlPath[item.key]}>
                        <RouterNavLink
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground data-[active]:bg-accent data-[active]:text-accent-foreground"
                          to={UrlPath[item.key]}
                        >
                          <span>{item.label}</span>
                        </RouterNavLink>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}

                <NavigationMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                        aria-expanded={anchorOA ? 'true' : 'false'}
                      >
                        OA連携
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start">
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.OAUsers}>OAユーザ表示</RouterNavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.OAOrders}>OA工番情報</RouterNavLink>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                        aria-expanded={anchorManage ? 'true' : 'false'}
                      >
                        管理
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.UserManage}>ユーザー設定</RouterNavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.CenterManage}>センター設定</RouterNavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.ManageRole}>アクセスユーザー設定</RouterNavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.Information}>お知らせ設定</RouterNavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.System}>システム設定</RouterNavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.UserSetting}>ユーザー設定状況</RouterNavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RouterNavLink to={UrlPath.Batch}>バッチステータス</RouterNavLink>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <VersionInfo />
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button>
                  {loginUser.user?.user_cd}({loginUser.user?.disp_name})
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <RouterNavLink to={UrlPath.MyPageEdit}>
                    MyPage設定変更
                  </RouterNavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <RouterNavLink to={UrlPath.UserProfile}>
                    ユーザー情報設定変更
                  </RouterNavLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopMenu;
