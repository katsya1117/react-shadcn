import React from "react";

export const DropdownMenu = ({ children, open, onOpenChange }: any) => (
  <div>
    <button
      type="button"
      data-testid="dropdown-toggle"
      onClick={() => onOpenChange?.(!open)}
    >
      toggle
    </button>
    {children}
  </div>
);

export const DropdownMenuTrigger = ({ children, asChild }: any) =>
  asChild ? <>{children}</> : <div>{children}</div>;

export const DropdownMenuContent = ({ children }: any) => (
  <div>{children}</div>
);

export const DropdownMenuItem = ({ children, asChild }: any) =>
  asChild ? <>{children}</> : <div>{children}</div>;

export const DropdownMenuLabel = ({ children }: any) => <div>{children}</div>;
export const DropdownMenuSeparator = () => <hr />;
export const DropdownMenuGroup = ({ children }: any) => <div>{children}</div>;
export const DropdownMenuSub = ({ children }: any) => <div>{children}</div>;
export const DropdownMenuSubTrigger = ({ children }: any) => (
  <div>{children}</div>
);
export const DropdownMenuSubContent = ({ children }: any) => (
  <div>{children}</div>
);
export const DropdownMenuCheckboxItem = ({ children }: any) => (
  <div>{children}</div>
);
export const DropdownMenuRadioGroup = ({ children }: any) => (
  <div>{children}</div>
);
export const DropdownMenuRadioItem = ({ children }: any) => (
  <div>{children}</div>
);
export const DropdownMenuShortcut = ({ children }: any) => (
  <span>{children}</span>
);
