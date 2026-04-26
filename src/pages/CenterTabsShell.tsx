import { SectionTabsShell } from "@/components/layout/SectionTabsShell";
import { UrlPath } from "@/constants/UrlPath";
import type { ReactNode } from "react";

type TabKey = "edit" | "new";

type Props = {
  active: TabKey;
  children: ReactNode;
};

const TABS = [
  { value: "edit", label: "設定", path: UrlPath.CenterManage },
  { value: "new", label: "登録", path: UrlPath.CenterCreate },
] as const;

export const CenterTabsShell = ({ active, children }: Props) => (
  <SectionTabsShell title="センター設定" tabs={TABS} active={active}>
    {children}
  </SectionTabsShell>
);

export type { TabKey as CenterTabKey };
