import React from "react";

export const RadioGroup = ({ value, onValueChange, children }: any) => (
  <div data-testid="radio-group" data-value={value}>
    {React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child as React.ReactElement<any>, {
        onChange: (e: any) => onValueChange(e.target.value),
        checked: value === (child as React.ReactElement<any>).props.value,
      });
    })}
  </div>
);

export const RadioGroupItem = ({ id, value, checked, onChange }: any) => (
  <input
    id={id}
    type="radio"
    value={value}
    checked={checked}
    onChange={onChange}
  />
);
