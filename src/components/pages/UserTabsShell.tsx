import { Layout } from "@/components/frame/Layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlPath } from "@/constant/UrlPath";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

type TabKey = "add" | "setting";

type Props = {
  active: TabKey;
  onTabChange?: (next: TabKey) => void;
  children: ReactNode;
};

export const UserTabsShell = ({ active, onTabChange, children }: Props) => {
  const navigate = useNavigate();
  const handleChange = (value: string) => {
    const next = value as TabKey;
    if (onTabChange) {
      onTabChange(next);
    }
    navigate(next === "add" ? UrlPath.UserCreate : UrlPath.UserManage);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">ユーザー設定</h1>
        <Tabs value={active} onValueChange={handleChange}>
          <div className="w-full border-b border-border/70">
            <TabsList
              variant="line"
              className="w-auto justify-start gap-3 px-0"
            >
              <TabsTrigger value="setting">編集</TabsTrigger>
              <TabsTrigger value="add">登録（AD連携）</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
        {children}
      </div>
    </Layout>
  );
};

export type { TabKey };
