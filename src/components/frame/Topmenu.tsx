// アイコンは一旦非表示運用のため import しない
import { useState, useEffect, forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { useSelector } from "react-redux";
import { useLocation, NavLink as RouterNavLink } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { UrlPath } from "../../constant/UrlPath";
import type { UrlPathKey } from "../../constant/UrlPath";
import { cn } from "@/lib/utils";
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
// import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  label: string;
  key: UrlPathKey;
  iconOnly?: boolean;
  end?: boolean;
};

const navItems: NavItem[] = [
  { label: "MyPage", key: "MyPage" },
  { label: "JOB SEARCH", key: "JobSearch", end: true },
  { label: "センター専用領域", key: "ShareArea" },
  { label: "LOG SEARCH", key: "LogSearch" },
  { label: "JOB作成", key: "JobCreate" },
  { label: "TOOL", key: "Tool" },
  { label: "OA連携", key: "OAUsers" }, // ドロップダウンの親判定用に先頭リンクを代表に
  { label: "管理", key: "UserManage" },
  { label: "ヘルプ", key: "Information", iconOnly: true },
];

const TopMenu = () => {
  const loginUser = useSelector(userSelector.loginUserSelector());
  // const [anchorOA, setAnchorOA] = useState(false);
  // const [anchorManage, setAnchorManage] = useState(false);
  const location = useLocation();

  // useEffect(() => {
  //   if (location.pathname.includes("/OA/")) {
  //     setAnchorOA(true);
  //   } else {
  //     setAnchorOA(false);
  //   }
  //   if (location.pathname.includes("/manage/")) {
  //     setAnchorManage(true);
  //   } else {
  //     setAnchorManage(false);
  //   }
  //   // user領域は今回のナビには未使用のためフラグも未使用
  // }, [location]);

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const isActive = (path: string) => location.pathname === path;
  const isOAActive = location.pathname.includes("/OA/");
  const isManageActive = location.pathname.includes("/manage/");

  return (
    <>
      <div className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
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
            <NavigationMenu onMouseLeave={() => setHoveredKey(null)}>
              <NavigationMenuList className="flex items-center space-x-1 text-sm whitespace-nowrap">
                <NavigationMenuItem>
                  <Information />
                </NavigationMenuItem>
                {navItems
                  .filter(
                    (item) =>
                      !item.iconOnly &&
                      item.key !== "OAUsers" && // ドロップダウン扱い
                      item.key !== "UserManage",
                  )
                  .map((item) => {
                    const path = UrlPath[item.key];
                    const active = isActive(path);
                    return (
                      <NavigationMenuItem
                        key={item.key}
                        className="relative h-14 flex items-center"
                        onMouseEnter={() => setHoveredKey(item.key)}
                      >
                        <AnimatePresence>
                          {hoveredKey === item.key && (
                            <motion.div
                              layoutId="hoverBg"
                              className="absolute inset-x-0 inset-y-2 rounded-md bg-muted z-0"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                          )}
                        </AnimatePresence>
                        <NavigationMenuLink asChild active={active}>
                          <RouterNavLink
                            className="relative z-10 inline-flex items-center px-3 py-2 font-medium transition-colors hover:text-foreground text-muted-foreground data-[active]:text-foreground"
                            to={path}
                          >
                            <span>{item.label}</span>
                          </RouterNavLink>
                        </NavigationMenuLink>
                        {active && (
                          <motion.div
                            layoutId="activeLIne"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground z-20"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                      </NavigationMenuItem>
                    );
                  })}

                <NavigationMenuItem
                  className="relative h-14 flex items-center"
                  onMouseEnter={() => setHoveredKey("OAUsers")}
                >
                  <AnimatePresence>
                  {hoveredKey === 'OAUsers' && (
                    <motion.div layoutId="hoverBg" className="absolute inset-x-0 inset-y-2 rounded-md bg-muted" />
                  )}
                </AnimatePresence>
                  <NavigationMenuTrigger className="relative z-10 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
                    OA連携
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[320px]">
                      <ListItem href={UrlPath.OAUsers} title="OAユーザ表示">
                        OA ユーザー一覧を確認
                      </ListItem>
                      <ListItem href={UrlPath.OAOrders} title="OA工番情報">
                        工番・案件情報を参照
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                  {isOAActive && (
                  <motion.div layoutId="activeLine" className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                )}
                </NavigationMenuItem>

                <NavigationMenuItem 
                  className="relative h-14 flex items-center"
                  onMouseEnter={() => setHoveredKey('UserManage')}
                >
                  <AnimatePresence>
                  {hoveredKey === 'UserManage' && (
                    <motion.div layoutId="hoverBg" className="absolute inset-x-0 inset-y-2 rounded-md bg-muted" />
                  )}
                </AnimatePresence>
                  <NavigationMenuTrigger className="relative z-10 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
                    管理
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[420px] lg:w-[520px]">
                      <ListItem href={UrlPath.UserManage} title="ユーザー設定">
                        ユーザー権限やプロフィールを管理
                      </ListItem>
                      <ListItem href={UrlPath.CenterManage} title="センター設定">
                        センター情報と連携先を設定
                      </ListItem>
                      <ListItem href={UrlPath.ManageRole} title="アクセスユーザー設定">
                        ロールとフォルダ権限を編集
                      </ListItem>
                      <ListItem href={UrlPath.Information} title="お知らせ設定">
                        通知・掲示を管理
                      </ListItem>
                      <ListItem href={UrlPath.System} title="システム設定">
                        全体の基本設定
                      </ListItem>
                      <ListItem href={UrlPath.UserSetting} title="ユーザー設定状況">
                        設定ステータスを確認
                      </ListItem>
                      <ListItem href={UrlPath.Batch} title="バッチステータス">
                        バッチ実行状況のモニタリング
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                  {isManageActive && (
                  <motion.div layoutId="activeLine" className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                )}
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <VersionInfo />
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="cursor-pointer select-none rounded-md px-3 py-2 text-sm hover:bg-muted">
                  {(loginUser?.user?.user_cd ?? "guest")}(
                  {loginUser?.user?.disp_name ?? loginUser?.user?.user_name ?? "noname"})
                </span>
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

// shadcn NavigationMenu の ListItem 相当
const ListItem = forwardRef<
  ElementRef<"a">,
  ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <RouterNavLink
          ref={ref}
          className={cn(
            "block space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{children}</p>
        </RouterNavLink>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
