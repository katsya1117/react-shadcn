import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="layout-mock">{children}</div>
);

export default Layout;
