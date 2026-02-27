import React from "react";

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="layout-mock">{children}</div>
);

export default Layout;
