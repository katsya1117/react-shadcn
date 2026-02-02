import { useState, forwardRef } from "react";
import { useSelector } from "react-redux";
import { useLocation, NavLink as RouterNavLink } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Tag } from "lucide-react";
import { UrlPath } from "../../constant/UrlPath";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";

const TopMenu = ({ hideMenu }: { hideMenu?: boolean }) => {
  const loginUser = useSelector(userSelector.loginUserSelector());
  const location = useLocation();
  
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [menuValue, setMenuValue] = useState<string | undefined>(undefined);
  const [infoOpen, setInfoOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  const [anchorUser, setAnchorUser] = useState(false);
  const anchorOA = location.pathname.includes("/OA/");
  const anchorManage = location.pathname.includes("/manage/");

  if (hideMenu) return null;

  const navItems = [
    { label: "MyPage", key: "MyPage", path: UrlPath.MyPage },
    { label: "JOB SEARCH", key: "JobSearch", path: UrlPath.JobSearch },
    { label: "センター専用領域", key: "ShareArea", path: UrlPath.ShareArea },
    { label: "LOG SEARCH", key: "LogSearch", path: UrlPath.LogSearch },
    { label: "JOB作成", key: "JobCreate", path: UrlPath.JobCreate },
    { label: "TOOL", key: "Tool", path: UrlPath.Tool },
  ] as const;

  return (
    <>
      <div className="sticky top-0 z-40 w-full min-w-max h-16 border-b backdrop-blur bg-[color:var(--header-bg)]">
        <div className="flex h-16 w-full min-w-max items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-semibold shrink-0 mr-2 text-lg">
              <span>Ops Console</span>
              <Badge variant="outline" className="hidden sm:inline-flex">
                Mock
              </Badge>
            </div>
            <NavigationMenu
              viewport={false}
              value={menuValue}
              onValueChange={setMenuValue}
              onMouseLeave={() => {
                setHoveredKey(null);
                setMenuValue(undefined);
              }}
            >
              <NavigationMenuList className="flex items-center space-x-1 text-sm px-1 whitespace-nowrap">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild active={false}>
                    <Information/>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {navItems
                  .map((item) => (
                      <NavigationMenuItem
                        key={item.key}
                        className="relative h-14 flex items-center"
                        onMouseEnter={() => setHoveredKey(item.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                      >
                        <HoverBackground isVisible={hoveredKey === item.key} />
                        {/* <AnimatePresence>
                          {hoveredKey === item.key && (
                            <motion.div
                              layoutId="hoverBg"
                              className="absolute inset-x-0 inset-y-2 rounded-md bg-muted z-0"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                          )}
                        </AnimatePresence> */}
                        <NavigationMenuLink asChild active={location.pathname === item.path}>
                          <RouterNavLink
                            to={item.path}
                            className="relative z-10 inline-flex items-center px-3 py-2 font-medium transition-colors hover:text-foreground text-muted-foreground data-[active]:text-foreground"
                          >
                            {item.label}
                          </RouterNavLink>
                        </NavigationMenuLink>
                        {location.pathname === item.path && <ActiveLine />}
                        {/* {active && (
                          <motion.div
                            layoutId="activeLine"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground z-20"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )} */}
                      </NavigationMenuItem>
                    )
                  )
                }

                <NavigationMenuItem
                  value="oa"
                  className="relative h-14 flex items-center"
                  onMouseEnter={() => {
                    setHoveredKey("OAUsers");
                    setMenuValue("oa");
                  }}
                  onMouseLeave={() => {
                    setHoveredKey(null);
                    setMenuValue(undefined);
                  }}
                >
                  <HoverBackground isVisible={hoveredKey === "OAUsers"} />
                  {/* <AnimatePresence>
                  {hoveredKey === 'OAUsers' && (
                    <motion.div layoutId="hoverBg" className="absolute inset-x-0 inset-y-2 rounded-md bg-muted" />
                  )}
                </AnimatePresence> */}
                  <NavigationMenuTrigger className="relative z-10 bg-transparent text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                    OA連携
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-2 p-3 md:w-[240px]">
                      <ListItem to={UrlPath.OAUsers} title="OAユーザ表示">
                      </ListItem>
                      <ListItem to={UrlPath.OAOrders} title="OA工番情報">
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                  {anchorOA && <ActiveLine />}
                  {/* {isOAActive && (
                  <motion.div layoutId="activeLine" className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                )} */}
                </NavigationMenuItem>

                <NavigationMenuItem 
                  value="manage"
                  className="relative h-14 flex items-center"
                  onMouseEnter={() => {
                    setHoveredKey('UserManage');
                    setMenuValue("manage");
                  }}
                  onMouseLeave={() => {
                    setHoveredKey(null);
                    setMenuValue(undefined);
                  }}
                >
                  <HoverBackground isVisible={hoveredKey === "UserManage"} />
                  {/* <AnimatePresence>
                  {hoveredKey === 'UserManage' && (
                    <motion.div layoutId="hoverBg" className="absolute inset-x-0 inset-y-2 rounded-md bg-muted" />
                  )}
                </AnimatePresence> */}
                  <NavigationMenuTrigger className="relative z-10 bg-transparent text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                    管理
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-2 p-3 md:w-[320px] lg:w-[380px] grid-cols-2">
                      <ListItem to={UrlPath.UserManage} title="ユーザー設定">
                      </ListItem>
                      <ListItem to={UrlPath.CenterManage} title="センター設定">
                        </ListItem>
                      <ListItem to={UrlPath.ManageRole} title="アクセスユーザー設定">
                        </ListItem>
                      <ListItem to={UrlPath.Information} title="お知らせ設定">
                        </ListItem>
                      <ListItem to={UrlPath.System} title="システム設定">
                        </ListItem>
                      <ListItem to={UrlPath.UserSetting} title="ユーザー設定状況">
                        </ListItem>
                      <ListItem to={UrlPath.Batch} title="バッチステータス">
                        </ListItem>
                    </ul>
                  </NavigationMenuContent>
                  {anchorManage && <ActiveLine />}
                  {/* {isManageActive && (
                  <motion.div layoutId="activeLine" className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                )} */}
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild active={false}>
                    <button
                      type="button"
                      onClick={() => setVersionOpen(true)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      aria-label="バージョン情報"
                    >
                      <Tag size={18} />
                    </button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <DropdownMenu open={anchorUser} onOpenChange={setAnchorUser}>
              <DropdownMenuTrigger asChild>
                <span
                  className="cursor-pointer select-none rounded-md px-3 py-2 text-sm hover:bg-muted ml-2"
                  onMouseEnter={() => setAnchorUser(true)}
                >
                  {loginUser?.user?.user_cd ?? "guest"}
                  ({loginUser?.user?.disp_name ?? loginUser?.user?.user_name ?? "noname"})
                </span>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onMouseLeave={() => setAnchorUser(false)}>
              <DropdownMenuItem asChild>
                <RouterNavLink to={UrlPath.MyPageEdit}>MyPage設定変更</RouterNavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <RouterNavLink to={UrlPath.UserProfile}>ユーザー情報設定変更</RouterNavLink>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
        </div>
      </div>
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent><DialogHeader><DialogTitle>お知らせ</DialogTitle></DialogHeader><Information /></DialogContent>
      </Dialog>
      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent><DialogHeader><DialogTitle>バージョン情報</DialogTitle></DialogHeader><VersionInfo version="v0.1.0" /></DialogContent>
      </Dialog>
    </>
  );
};

const HoverBackground = ({ isVisible }: { isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        layoutId="hoverBg"
        className="absolute inset-x-0 inset-y-2 rounded-md bg-muted z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    )}
  </AnimatePresence>
);

const ActiveLine = () => (
  <motion.div
    layoutId="activeLine"
    className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground z-20"
    transition={{ type: "spring", stiffness: 380, damping: 30 }}
  />
);

const IconButton = ({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) => (
  <NavigationMenuLink asChild>
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
    >
      {icon}
    </button>
  </NavigationMenuLink>
);

interface ListItemProps extends React.ComponentPropsWithoutRef<typeof RouterNavLink> {
  title: string;
  to: string;
}

const ListItem = forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, to, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <RouterNavLink
            ref={ref}
            to={to}
            className={cn(
              "block space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm text-muted-foreground"></p>
          </RouterNavLink>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";

export default TopMenu;
