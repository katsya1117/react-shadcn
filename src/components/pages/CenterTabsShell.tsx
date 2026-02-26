import { Layout } from "@/components/frame/Layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlPath } from "@/constant/UrlPath";
import { useNavigate } from "react-router";
import type { ReactNode } from "react";

type TabKey = "edit" | "new";

type Props = {
  active: TabKey;
  children: ReactNode;
};

export const CenterTabsShell = ({ active, children }: Props) => {
  const navigate = useNavigate();
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">センター設定</h1>
        <Tabs
          value={active}
          onValueChange={(v) =>
            navigate(v === "new" ? UrlPath.CenterCreate : UrlPath.CenterManage)
          }
        >
          <div className="w-full border-b border-border/70">
            <TabsList
              variant="line"
              className="w-auto justify-start gap-3 px-0"
            >
              <TabsTrigger value="edit">設定</TabsTrigger>
              <TabsTrigger value="new">登録</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
        {children}
      </div>
    </Layout>
  );
};

export type { TabKey as CenterTabKey };
