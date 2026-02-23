export const Tabs = ({ children, onValueChange }: any) => (
  <div
    onClick={(e: any) => {
      const btn = e.target.closest("button");
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
