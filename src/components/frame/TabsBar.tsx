import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router";
import { UrlPath } from "@/constant/UrlPath";
import { TabsBarStyle } from "./TabsBar.css";
import { useDispatch } from "react-redux";
import { navActions } from "@/redux/slices/navSlice";

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
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentPath = location.pathname;

  const isOA = currentPath.startsWith("/OA/");
  const isManage = currentPath.startsWith("/manage/");

  const items = isOA ? oaTabs : isManage ? manageTabs : [];
  if (items.length === 0) return null;

  const getRootKey = (path: string) => {
    const segments = path.split("/").filter(Boolean);
    return segments.length > 0 ? `/${segments[0]}` : "/";
  };

  type TabValue = (typeof oaTabs | typeof manageTabs)[number]["value"];
  const matched = items.find((t) => currentPath.startsWith(t.value));
  const active: TabValue = (matched ? matched.value : items[0].value) as TabValue;

  return (
    <div className={TabsBarStyle.container}>
      <div className={TabsBarStyle.inner}>
        <Tabs
          value={active}
          onValueChange={(v) => {
            dispatch(navActions.setLastVisited({ key: getRootKey(v), path: v }));
            navigate(v);
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
