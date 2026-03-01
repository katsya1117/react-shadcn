import { useState, useEffect, useRef, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, NavLink as RouterNavLink } from "react-router";
import { UrlPath } from "@/constant/UrlPath";
import { TabsBarStyle } from "./TabsBar.css.ts";
import { useDispatch, useSelector } from "react-redux";
import { uiActions, uiSelector } from "@/redux/slices/uiSlice";
import type { AppDispatch } from "../../redux/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal } from "lucide-react";

const OA_TABS = [
  { to: UrlPath.OAUsers, label: "OAユーザ表示" },
  { to: UrlPath.OAOrders, label: "OA工番情報" },
];

const MANAGE_TABS = [
  { to: UrlPath.UserManage, label: "ユーザー設定" },
  { to: UrlPath.CenterManage, label: "センター設定" },
  { to: UrlPath.ManageRole, label: "アクセスユーザー設定" },
  { to: UrlPath.Information, label: "お知らせ設定" },
  { to: UrlPath.System, label: "システム設定" },
  { to: UrlPath.UserSetting, label: "ユーザー設定状況" },
  { to: UrlPath.Batch, label: "バッチステータス" },
];

export const TabsBar = () => {
  const { pathname } = useLocation();
  const dispatch: AppDispatch = useDispatch();
  const lastVisited = useSelector(uiSelector.lastVisited);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevWidthRef = useRef<number>(0);

  const group = useMemo(() => {
    if (pathname.startsWith("/OA/")) return "OA";
    if (pathname.startsWith("/manage/")) return "manage";
    return "none";
  }, [pathname]);

  const items = useMemo(() => {
    if (group === "OA") return OA_TABS;
    if (group === "manage") return MANAGE_TABS;
    return [];
  }, [group]);
  const matched = items.find(
    (t) => pathname === t.to || pathname.startsWith(`${t.to}/`),
  );
  useEffect(() => {
    if (!matched) return;
    if (lastVisited[matched.to] === pathname) return;
    dispatch(uiActions.setLastVisited({ key: matched.to, path: pathname }));
  }, [pathname, matched, dispatch, lastVisited]);

  const [visibleCount, setVisibleCount] = useState(items.length);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;

      if (containerWidth === prevWidthRef.current) return;
      prevWidthRef.current = containerWidth;

      const items = container.querySelectorAll(".tab-item");
      let totalWidth = 0;
      let count = 0;
      items.forEach((item) => {
        totalWidth += (item as HTMLElement).offsetWidth;
        if (totalWidth <= containerWidth) {
          count++;
        }
      });
      setVisibleCount((prev) => (prev !== count ? count : prev));
    };
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    handleResize();
    return () => resizeObserver.disconnect();
  }, [items]);

  const overflowTabs = useMemo(
    () => items.slice(visibleCount),
    [items, visibleCount],
  );

  if (items.length === 0) return <></>;

  const active = matched ? matched.to : items[0].to;

  return (
    <div className={TabsBarStyle.container}>
      <div className={TabsBarStyle.inner} ref={containerRef}>
        <div>
          <Tabs value={active} className="w-auto">
            <TabsList variant="line" className="mx-auto">
              {items.map((item, index) => {
                const resolvedTo = lastVisited[item.to] || item.to;
                const isHidden = index >= visibleCount;
                return (
                  <TabsTrigger
                    key={item.to}
                    value={item.to}
                    className={cn(
                      "tab-item relative h-9 rounded-none data-[state=active]:text-foreground data-[state=active]:shadow-none",
                      "after:hidden",
                      isHidden &&
                        "opacity-0 pointer-events-none absolute inset-0",
                    )}
                    asChild
                  >
                    <RouterNavLink to={resolvedTo}>
                      {item.label}
                      {active === item.to && (
                        <motion.div
                          layoutId={`activeLine-${group}`}
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground z-20"
                          transition={{
                            type: "spring",
                            stiffness: 250,
                            damping: 32,
                          }}
                          initial={false}
                        />
                      )}
                    </RouterNavLink>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
        {overflowTabs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end"
            className="p-2 [&>a]:p-2">
              {overflowTabs.map((item)=>{
                const resolvedTo =
                lastVisited[item.to] || item.to;
                return(
                  <DropdownMenuItem key={item.to} asChild>
                    <RouterNavLink to={resolvedTo}>
                      {item.label}
                    </RouterNavLink>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
