import React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * shadcn の <Select>（実体は Radix のポップオーバー UI）をネイティブ <select> に置き換えるモック。
 *
 *   <Select value onValueChange>      → <select data-testid="select">
 *   <SelectItem value>ラベル          → <option value>ラベル</option>
 *   <SelectTrigger> / <SelectValue>   → 見た目専用なので何も描画しない
 *   <SelectContent> / <SelectGroup>   → 子要素をそのまま通す
 *
 * これでテストからは `user.selectOptions(getByTestId("select"), value)` で操作でき、
 * <select> 直下には <option> だけが入る（DOM ネストの警告も出ない）。
 */
export const Select = ({ value, onValueChange, disabled, children }: any) => (
  <select
    data-testid="select"
    value={value}
    disabled={disabled}
    onChange={(e) => onValueChange?.(e.target.value)}
  >
    {children}
  </select>
);

export const SelectItem = ({ value, children }: any) => (
  <option value={value}>{children}</option>
);

export const SelectContent = ({ children }: any) => <>{children}</>;
export const SelectGroup = ({ children }: any) => <>{children}</>;

// 見た目専用の要素。<select> の中に DOM を挿入しないよう、何も描画しない。
export const SelectTrigger = () => null;
export const SelectValue = () => null;
export const SelectLabel = () => null;
export const SelectSeparator = () => null;
export const SelectScrollUpButton = () => null;
export const SelectScrollDownButton = () => null;
