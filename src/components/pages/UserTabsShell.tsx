import { SectionTabsShell } from "@/components/frame/SectionTabsShell";
import { UrlPath } from "@/constant/UrlPath";
import type { ReactNode } from "react";

type TabKey = "add" | "setting";

type Props = {
  active: TabKey;
  onTabChange?: (next: TabKey) => void;
  children: ReactNode;
};

const TABS = [
  { value: "setting", label: "編集", path: UrlPath.UserManage },
  { value: "add", label: "登録（AD連携）", path: UrlPath.UserCreate },
] as const;

export const UserTabsShell = ({ active, onTabChange, children }: Props) => (
  <SectionTabsShell
    title="ユーザー設定"
    tabs={TABS}
    active={active}
    onTabChange={onTabChange ? (v) => onTabChange(v as TabKey) : undefined}
  >
    {children}
  </SectionTabsShell>
);

export type { TabKey };
