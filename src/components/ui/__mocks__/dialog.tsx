import React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
// open のときだけ children を描画して radix のポータル/フォーカストラップを回避する。
export const Dialog = ({ open, children }: any) =>
  open ? <div data-testid="dialog">{children}</div> : null;
export const DialogContent = ({ children }: any) => <div>{children}</div>;
export const DialogHeader = ({ children }: any) => <div>{children}</div>;
export const DialogFooter = ({ children }: any) => <div>{children}</div>;
export const DialogTitle = ({ children }: any) => <h2>{children}</h2>;
export const DialogDescription = ({ children }: any) => <p>{children}</p>;
export const DialogTrigger = ({ children }: any) => <>{children}</>;
export const DialogClose = ({ children }: any) => <>{children}</>;
export const DialogOverlay = ({ children }: any) => <>{children}</>;
export const DialogPortal = ({ children }: any) => <>{children}</>;
