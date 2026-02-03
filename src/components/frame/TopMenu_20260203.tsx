import { motion, AnimatePresence } from 'framer-motion';
import { useEffect,useState, forwardRef } from "react";
// react-bootstrap から移行
// import {
//   Container,
//   Dropdown,
//   Nav,
//   Navbar,
//   NavItem,
//   NavLink,
// } from 'react-bootstrap';
import { useSelector } from "react-redux";
import { NavLink as RouterNavLink, useLocation } from 'react-router';
import { UrlPath } from "../../constant/UrlPath";
import { userSelector } from "../../redux/slices/userSlice";
import { Information } from "../parts/Information/Information";
import { VersionInfo } from "../parts/Version/VersionInfo";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

import { Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TopMenu = (props: { hideMenu?: boolean }) => {
  const loginUser = useSelector(userSelector.loginUserSelector());
  // const isLoading = useSelector(userSelector.isLoadingSelector());
  // const isLogin = useSelector(userSelector.isLoginSelector());
  
  // 現在どこにホバーしているか
  const [hoveredKey, setHoveredKey] = useState<string | undefined>(undefined);
  const [anchorOA, setAnchorOA] = useState(false);
  const [anchorManage, setAnchorManage] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('/OA/')) {
      setAnchorOA(true);
    } else {
      setAnchorOA(false);
    }

    if (location.pathname.includes('/manage/')) {
      setAnchorManage(true);
    } else {
      setAnchorManage(false);
    }

    return () => {
      // クリーンアップ
    };
  }, [location]);

  // if (!loginUser) {
  //   return <></>;
  // }

  // if (props.hideMenu) {
  //   return <></>;
  // }

  const singleNavItems = [
    { label: 'MyPage', key: 'MyPage', path: UrlPath.MyPage },
    { label: 'JOB SEARCH', key: 'JobSearch', path: UrlPath.JobSearch },
    {
      label: 'センター専用領域',
      key: 'ShareArea',
      path: UrlPath.ShareArea,
    },
    { label: 'LOG SEARCH', key: 'LogSearch', path: UrlPath.LogSearch },
    { label: 'JOB', key: 'JobCreate', path: UrlPath.JobCreate },
    { label: 'TOOL', key: 'Tool', path: UrlPath.Tool },
  ];

  return (
    <div className="sticky top-0 z-40 w-full border-b backdrop-blur bg-background min-w-max">
      <div className="flex h-14 w-full min-w-max items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        <div className="flex items-center gap-2 font-semibold text-lg shrink-0">
          <span>JCL</span>
        </div>

        <div className="mx-auto flex items-center gap-3">
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="flex items-center space-x-1 text-sm whitespace-nowrap">
              <NavigationMenuItem>
                <Information />
              </NavigationMenuItem>

              {singleNavItems.map((item) => (
                <NavigationMenuItem
                  key={item.key}
                  className="relative h-14 flex items-center"
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(undefined)}
                >
                  <HoverBackground isVisible={hoveredKey === item.key} />

                  <NavigationMenuLink asChild active={location.pathname === item.path}>
                    <RouterNavLink
                      to={item.path}
                      className="relative z-10 px-3 py-2 font-medium transition-colors hover:text-foreground text-muted-foreground data-[active]:text-foreground"
                    >
                      {item.label}
                    </RouterNavLink>
                  </NavigationMenuLink>

                  {location.pathname === item.path && <ActiveLine />}
                </NavigationMenuItem>
              ))}

              {/* ドロップダウン：OA連携 */}
              <NavigationMenuItem
                className="relative h-14 flex items-center"
                onMouseEnter={() => setHoveredKey('oa')}
                onMouseLeave={() => setHoveredKey(undefined)}
              >
                <HoverBackground isVisible={hoveredKey === 'oa'} />

                <NavigationMenuTrigger className="relative z-10 bg-transparent text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                  OA連携
                </NavigationMenuTrigger>

                <NavigationMenuContent>
                  <ul className="grid gap-2 p-3 w-[180px] text-left">
                    <ListItem to={UrlPath.OAUsers} title="OAユーザー表示" />
                    <ListItem to={UrlPath.OAOrders} title="OA工番情報" />
                  </ul>
                </NavigationMenuContent>

                {anchorOA && <ActiveLine />}
              </NavigationMenuItem>

              {/* ドロップダウン：管理 */}
              <NavigationMenuItem
                className="relative h-14 flex items-center"
                onMouseEnter={() => setHoveredKey('manage')}
                onMouseLeave={() => setHoveredKey(undefined)}
              >
                <HoverBackground isVisible={hoveredKey === 'manage'} />

                <NavigationMenuTrigger className="relative z-10 bg-transparent text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                  管理
                </NavigationMenuTrigger>

                <NavigationMenuContent>
                  <ul className="grid gap-2 p-3 w-[360px] grid-cols-2 text-left">
                    <ListItem to={UrlPath.UserManage} title="ユーザー設定" />
                    <ListItem to={UrlPath.CenterManage} title="センター設定" />
                    <ListItem to={UrlPath.ManageRole} title="アクセスユーザー設定" />
                    <ListItem to={UrlPath.Information} title="お知らせ設定" />
                    <ListItem to={UrlPath.System} title="システム設定" />
                    <ListItem to={UrlPath.UserSetting} title="ユーザー設定状況" />
                    <ListItem to={UrlPath.Batch} title="バッチステータス" />
                  </ul>
                </NavigationMenuContent>

                {anchorManage && <ActiveLine />}
              </NavigationMenuItem>

              <NavigationMenuItem>
                <VersionInfo />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem className="flex text-sm items-center whitespace-nowrap h-14">
              <NavigationMenuTrigger className="relative z-10 bg-transparent text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                {/* {loginUser.user?.user_cd} ({loginUser.user?.disp_name}) */}
              takagi.katsuya(高木克也)
              </NavigationMenuTrigger>

              <NavigationMenuContent>
                <ul className="grid gap-2 p-3 w-[180px] text-left">
                  <ListItem to={UrlPath.MyPageEdit} title="MyPage設定変更" />
                  <ListItem to={UrlPath.UserProfile} title="ユーザー情報設定変更" />
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
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
    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
  />
);

interface ListItemProps extends React.ComponentPropsWithoutRef<typeof RouterNavLink> {
  title: string;
  to: string;
}

const ListItem = forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, to, ...props }, ref) => (
    <li>
      <NavigationMenuLink asChild>
        <RouterNavLink
          ref={ref}
          to={to}
          className={cn(
            'block space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          {/* 説明文を入れる場合用 */}
          {/* <p className="line-clamp-2 text-sm text-muted-foreground">{children}</p> */}
        </RouterNavLink>
      </NavigationMenuLink>
    </li>
  )
);