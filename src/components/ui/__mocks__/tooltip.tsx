import React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const Tooltip = ({ children }: any) => <>{children}</>;
export const TooltipTrigger = ({ children }: any) => <>{children}</>;
// ツールチップ本文はホバーまで非表示なので、テストでの重複テキストを避けるため描画しない。
export const TooltipContent = () => null;
