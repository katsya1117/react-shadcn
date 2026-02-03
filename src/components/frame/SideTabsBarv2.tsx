import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router";
import { UrlPath } from "@/constant/UrlPath";

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

const SideTabsBarv2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isOA = currentPath.startsWith("/OA/");
  const isManage = currentPath.startsWith("/manage/");

  const items = isOA ? oaTabs : isManage ? manageTabs : [];
  if (items.length === 0) return null;

  const active =
    items.find((t) => currentPath.startsWith(t.value))?.value ?? items[0]?.value ?? "";

  return (
    <Tabs value={active} onValueChange={(v) => navigate(v)} className="w-full" orientation="horizontal">
      <TabsList variant="line" className="mb-3">
        {items.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default SideTabsBarv2;
