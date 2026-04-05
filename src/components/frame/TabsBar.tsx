import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
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

export const TabsBar = ({ className }: { className?: string }) => {
  const { pathname } = useLocation();
  const dispatch: AppDispatch = useDispatch();
  const lastVisited = useSelector(uiSelector.lastVisited);
  const isSideMenuCollapsed = useSelector(uiSelector.isSideMenuCollapsed);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const overflowTriggerMeasureRef = useRef<HTMLButtonElement | null>(null);

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

  useLayoutEffect(() => {
    const updateVisibleCount = () => {
      if (!containerRef.current || !measureRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const measuredTabs =
        measureRef.current.querySelectorAll<HTMLElement>("[data-tab-measure]");
      const tabWidths = Array.from(measuredTabs, (item) => item.offsetWidth);
      const totalWidth = tabWidths.reduce((sum, width) => sum + width, 0);

      if (totalWidth <= containerWidth) {
        setVisibleCount(items.length);
        return;
      }

      const overflowTriggerWidth =
        overflowTriggerMeasureRef.current?.offsetWidth ?? 0;
      const availableWidth = Math.max(containerWidth - overflowTriggerWidth, 0);

      let count = 0;
      let usedWidth = 0;
      for (const width of tabWidths) {
        if (usedWidth + width > availableWidth) break;
        usedWidth += width;
        count++;
      }

      setVisibleCount(count);
    };

    const resizeObserver = new ResizeObserver(updateVisibleCount);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (measureRef.current) resizeObserver.observe(measureRef.current);

    updateVisibleCount();

    return () => resizeObserver.disconnect();
  }, [items, isSideMenuCollapsed]);

  const visibleTabs = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );
  const overflowTabs = useMemo(
    () => items.slice(visibleCount),
    [items, visibleCount],
  );

  if (items.length === 0) return <></>;

  const active = matched ? matched.to : items[0].to;

  return (
    <div className={cn(TabsBarStyle.container, className)}>
      <div className={cn(TabsBarStyle.inner, "relative")} ref={containerRef}>
        <div
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute left-0 top-0 -z-10 flex items-center gap-2"
        >
          <Tabs value={active} className="w-auto">
            <TabsList variant="line" className="mx-auto">
              {items.map((item) => (
                <TabsTrigger
                  key={`measure-${item.to}`}
                  value={item.to}
                  data-tab-measure
                  className="relative h-9 rounded-none after:hidden data-[state=active]:shadow-none"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button ref={overflowTriggerMeasureRef} variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div>
          <Tabs value={active} className="w-auto">
            <TabsList variant="line" className="mx-auto">
              {visibleTabs.map((item) => {
                const resolvedTo = lastVisited[item.to] || item.to;
                return (
                  <TabsTrigger
                    key={item.to}
                    value={item.to}
                    className={cn(
                      "tab-item relative h-9 rounded-none data-[state=active]:text-[color:var(--brand)] data-[state=active]:shadow-none",
                      "after:hidden",
                    )}
                    asChild
                  >
                    <RouterNavLink to={resolvedTo}>
                      {item.label}
                      {active === item.to && (
                        <motion.div
                          layoutId={`activeLine-${group}`}
                          className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-[color:var(--brand)]"
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
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  overflowTabs.some((item) => item.to === active) &&
                    "bg-[color:var(--brand-soft)] text-[color:var(--brand)]",
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-2 [&>a]:p-2">
              {overflowTabs.map((item) => {
                const resolvedTo = lastVisited[item.to] || item.to;
                return (
                  <DropdownMenuItem key={item.to} asChild>
                    <RouterNavLink to={resolvedTo}>
                      {item.label}
                    </RouterNavLink>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
