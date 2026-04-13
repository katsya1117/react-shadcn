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
    // window.scrollTo({ top: 0, behavior: "instant" });
    if (onTabChange) {
      onTabChange(next);
    }
    navigate(next === "add" ? UrlPath.UserCreate : UrlPath.UserManage);
  };

  return (
    // <Layout>
    <div className="space-y-6">
      <div className="space-y-6 sticky top-[5.75rem] pb-0.5 z-20 bg-background -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <h1 className="pt-3 -mt-3 text-2xl font-semibold">ユーザー設定</h1>
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
      </div>
      {children}
    </div>
    // </Layout>
  );
};

export type { TabKey };
