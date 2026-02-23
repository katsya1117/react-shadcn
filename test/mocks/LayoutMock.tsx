import React from "react";

const LayoutMock = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="layout-mock">{children}</div>
);

export default LayoutMock;
