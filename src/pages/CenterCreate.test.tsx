import { jest } from "@jest/globals";
import React from "react";
import { screen } from "@testing-library/react";
import { setup } from "@test-utils";
import { MemoryRouter } from "react-router";
import { CenterCreate } from "./CenterCreate";

jest.mock("@/pages/CenterTabsShell", () => ({
  __esModule: true,
  CenterTabsShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-shell">{children}</div>
  ),
}));

describe("CenterCreate", () => {
  it("センター作成フォームが表示される", () => {
    setup(
      <MemoryRouter>
        <CenterCreate />
      </MemoryRouter>,
    );

    expect(screen.getByText("センター作成")).toBeInTheDocument();
    expect(screen.getByText("センター新規登録フォームのモックです。")).toBeInTheDocument();
  });
});
