import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

type TabDef = {
  value: string;
  label: string;
  path: string;
};

type Props = {
  title: string;
  tabs: TabDef[];
  active: string;
  onTabChange?: (next: string) => void;
  children: ReactNode;
};

export const SectionTabsShell = ({ title, tabs, active, onTabChange, children }: Props) => {
  const navigate = useNavigate();

  const handleChange = (value: string) => {
    onTabChange?.(value);
    const tab = tabs.find((t) => t.value === value);
    if (tab) navigate(tab.path);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 sticky top-[5.75rem] pb-0.5 z-20 bg-background -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <h1 className="pt-3 -mt-3 text-2xl font-semibold">{title}</h1>
        <Tabs value={active} onValueChange={handleChange}>
          <div className="w-full border-b border-border/70">
            <TabsList variant="line" className="w-auto justify-start gap-3 px-0">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>
      {children}
    </div>
  );
};
