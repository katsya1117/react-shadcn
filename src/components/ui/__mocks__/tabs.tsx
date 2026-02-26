import React from "react";

export const Tabs = ({ children, onValueChange }: any) => (
  <div
    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const btn = target.closest("button");
      const val = btn?.getAttribute("data-value");
      if (val) onValueChange?.(val);
    }}
  >
    {children}
  </div>
);

export const TabsList = ({ children }: any) => <div>{children}</div>;

export const TabsTrigger = ({ value, children }: any) => (
  <button data-value={value} type="button">
    {children}
  </button>
);

export const TabsContent = ({ children }: any) => <div>{children}</div>;

export const tabsListVariants = () => "";
