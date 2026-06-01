import React from "react";

export const ConfirmButton = ({ onHandle, buttonLabel }: any) => (
  <button onClick={() => onHandle && onHandle()}>{buttonLabel}</button>
);

export default ConfirmButton;
