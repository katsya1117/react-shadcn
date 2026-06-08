import React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const AutoCompleteSingle = ({ value, onChange }: any) => (
  <select
    data-testid="auto-complete-single"
    value={value?.value ?? ""}
    onChange={(e) => onChange({ value: e.target.value, label: e.target.value })}
  >
    <option value="">選択してください</option>
    <option value="c1">c1</option>
  </select>
);

export default AutoCompleteSingle;
