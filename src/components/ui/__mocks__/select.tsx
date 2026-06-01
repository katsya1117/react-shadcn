import React from "react";

export const Select = ({ value, onValueChange, children }: any) => (
  <select
    data-testid="select-permission"
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
  >
    {children}
  </select>
);

export const SelectTrigger = ({ children }: any) => <div>{children}</div>;
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;
export const SelectContent = ({ children }: any) => <>{children}</>;
export const SelectGroup = ({ children }: any) => <>{children}</>;
export const SelectItem = ({ value, children }: any) => (
  <option value={value}>{children}</option>
);
export const SelectLabel = ({ children }: any) => <>{children}</>;
export const SelectSeparator = () => null;
export const SelectScrollUpButton = () => null;
export const SelectScrollDownButton = () => null;
