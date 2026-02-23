import React from "react";

const AutoCompleteMultiMock = ({ value, onChange }: any) => (
  <select
    data-testid="auto-complete-multi"
    multiple
    value={(value ?? []).map((v: any) => v.value)}
    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
      onChange([{ value: e.target.value, label: e.target.value }])
    }
  >
    <option value="center1">center1</option>
  </select>
);

export { AutoCompleteMultiMock as AutoCompleteMulti };
