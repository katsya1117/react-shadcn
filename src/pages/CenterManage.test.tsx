import { jest } from "@jest/globals";
import { UrlPath } from "@/constants/UrlPath";
import { screen } from "@testing-library/react";
import { setup } from "@test-utils";
import { MemoryRouter } from "react-router";
import { CenterManage } from "./CenterManage";

const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;

jest.mock("@/pages/CenterTabsShell", () => ({
  __esModule: true,
  CenterTabsShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-shell">{children}</div>
  ),
}));

describe("CenterManage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("初期表示では検索前メッセージが表示される", () => {
    setup(
      <MemoryRouter>
        <CenterManage />
      </MemoryRouter>,
    );

    expect(screen.getByText("「検索」ボタンを押すと結果が表示されます。")).toBeInTheDocument();
    expect(screen.queryByText("東京センター")).not.toBeInTheDocument();
  });

  it("検索ボタンを押すとセンター一覧が表示される", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterManage />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("検索"));

    expect(screen.getByText("東京センター")).toBeInTheDocument();
    expect(screen.getByText("大阪DR")).toBeInTheDocument();
    expect(screen.getByText("監査チーム")).toBeInTheDocument();
  });

  it("キーワード入力で絞り込まれる", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterManage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("例: 東京センター"), "東京");
    await user.click(screen.getByText("検索"));

    expect(screen.getByText("東京センター")).toBeInTheDocument();
    expect(screen.queryByText("大阪DR")).not.toBeInTheDocument();
  });

  it("一致しないキーワードでは「見つかりませんでした」メッセージが表示される", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterManage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("例: 東京センター"), "存在しない");
    await user.click(screen.getByText("検索"));

    expect(screen.getByText("該当するセンターが見つかりませんでした。")).toBeInTheDocument();
  });

  it("選択ボタンで CenterEdit へナビゲートする", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterManage />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("検索"));
    const selectButtons = screen.getAllByText("選択");
    await user.click(selectButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(
      UrlPath.CenterEdit.replace(":center_cd", "c001"),
    );
  });
});
