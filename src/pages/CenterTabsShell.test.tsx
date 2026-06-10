import { jest } from "@jest/globals";
import { UrlPath } from "@/constants/UrlPath";
import { screen } from "@testing-library/react";
import { setup } from "@test-utils";
import { MemoryRouter } from "react-router";
import { CenterTabsShell } from "./CenterTabsShell";

const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;

// 非同期は await user.click（タブ押下）のみ。押下で navigate される引数を検証する。
// クリックで navigate は同期的に呼ばれるため waitFor 不要。考え方は test/README.md「7」を参照。

describe("CenterTabsShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("設定タブをクリックすると CenterManage へナビゲートする", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterTabsShell active="new">
          <div data-testid="child">child</div>
        </CenterTabsShell>
      </MemoryRouter>,
    );

    await user.click(screen.getByText("設定"));
    expect(mockNavigate).toHaveBeenCalledWith(UrlPath.CenterManage);
  });

  it("登録タブをクリックすると CenterCreate へナビゲートする", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterTabsShell active="edit">
          <div>child</div>
        </CenterTabsShell>
      </MemoryRouter>,
    );

    await user.click(screen.getByText("登録"));
    expect(mockNavigate).toHaveBeenCalledWith(UrlPath.CenterCreate);
  });
});
