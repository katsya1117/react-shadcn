import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router";
import { UrlPath } from "@/constant/UrlPath";
import { TabsBarStyle } from "./TabsBar.css";
import { useDispatch, useSelector } from "react-redux";
import { navActions, navSelector } from "@/redux/slices/navSlice";

const oaTabs = [
  { value: UrlPath.OAUsers, label: "OAユーザ表示" },
  { value: UrlPath.OAOrders, label: "OA工番情報" },
];

const manageTabs = [
  { value: UrlPath.UserManage, label: "ユーザー設定" },
  { value: UrlPath.CenterManage, label: "センター設定" },
  { value: UrlPath.ManageRole, label: "アクセスユーザー設定" },
  { value: UrlPath.Information, label: "お知らせ設定" },
  { value: UrlPath.System, label: "システム設定" },
  { value: UrlPath.UserSetting, label: "ユーザー設定状況" },
  { value: UrlPath.Batch, label: "バッチステータス" },
];

const TabsBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const lastVisited = useSelector(navSelector.lastVisitedSelector());

  const isOA = pathname.startsWith("/OA/");
  const isManage = pathname.startsWith("/manage/");
  const items = isOA ? oaTabs : isManage ? manageTabs : [];

  const matched = items.find(
    (t) => pathname === t.value || pathname.startsWith(`${t.value}/`),
  );
  useEffect(() => {
    if (!matched) return;
    if (lastVisited[matched.value] === pathname) return;
    dispatch(navActions.setLastVisited({ key: matched.value, path: pathname }));
  }, [pathname, matched, dispatch, lastVisited]);

  if (items.length === 0) return null;

  // const getRootPrefix = (path: string) => {
  // const first = path.split("/").filter(Boolean)[0];
  // return first ? `/${first}` : "/";

  const active = matched ? matched.value : items[0].value;

  return (
    <div className={TabsBarStyle.container}>
      <div className={TabsBarStyle.inner}>
        <Tabs
          value={active}
          onValueChange={(v) => {
            const target = lastVisited[v] || v;
            navigate(target);
          }}
          className="w-auto"
          orientation="horizontal"
        >
          <TabsList variant="line" className="mx-auto">
            {items.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default TabsBar;
