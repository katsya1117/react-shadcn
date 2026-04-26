import { UrlPath } from "@/constant/UrlPath";
import { screen } from "@testing-library/react";
import { setup } from "@test-utils";
import { MemoryRouter } from "react-router";
import { UserTabsShell } from "./UserTabsShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;

describe("UserTabsShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("編集タブをクリックすると UserManage へナビゲートし、onTabChangeも呼ばれる", async () => {
    const onTabChangeMock = jest.fn();
    const { user } = setup(
      <MemoryRouter>
        <UserTabsShell active="add" onTabChange={onTabChangeMock}>
          <div data-testid="child">child</div>
        </UserTabsShell>
      </MemoryRouter>,
    );

    await user.click(screen.getByText("編集"));

    expect(mockNavigate).toHaveBeenCalledWith(UrlPath.UserManage);
    expect(onTabChangeMock).toHaveBeenCalledWith("setting");
  });

  it("登録タブをクリックすると UserCreate へナビゲートする", async () => {
    const { user } = setup(
      <MemoryRouter>
        <UserTabsShell active="setting">
          <div>child</div>
        </UserTabsShell>
      </MemoryRouter>,
    );

    await user.click(screen.getByText("登録（AD連携）"));
    expect(mockNavigate).toHaveBeenCalledWith(UrlPath.UserCreate);
  });
});
