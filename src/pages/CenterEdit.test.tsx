import { jest } from "@jest/globals";
import { UrlPath } from "@/constants/UrlPath";
import { screen, waitFor } from "@testing-library/react";
import { setup } from "@test-utils";
import { MemoryRouter } from "react-router";
import { CenterEdit } from "./CenterEdit";

const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;

jest.mock("@/pages/CenterTabsShell", () => ({
  __esModule: true,
  CenterTabsShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-shell">{children}</div>
  ),
}));

jest.mock("@/components/common/Confirm/ConfirmButton", () => ({
  __esModule: true,
  ConfirmButton: ({ onHandle, buttonLabel }: any) => (
    <button onClick={() => onHandle && onHandle()}>{buttonLabel}</button>
  ),
}));

jest.mock("@/components/ui/sonner", () => ({
  toast: jest.fn(),
}));

describe("CenterEdit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).mockParams = { center_cd: "c001" };
  });

  afterEach(() => {
    (globalThis as any).mockParams = {};
  });

  it("センター情報がパラメータから表示される", () => {
    setup(
      <MemoryRouter>
        <CenterEdit />
      </MemoryRouter>,
    );

    expect(screen.getByText("東京センター")).toBeInTheDocument();
    expect(screen.getByText("センターコード: c001")).toBeInTheDocument();
  });

  it("存在しないコードの場合はデフォルト表示になる", () => {
    (globalThis as any).mockParams = { center_cd: "x999" };
    setup(
      <MemoryRouter>
        <CenterEdit />
      </MemoryRouter>,
    );

    expect(screen.getByText("センター編集")).toBeInTheDocument();
    expect(screen.getByText("センターコード: x999")).toBeInTheDocument();
  });

  it("戻るボタンで navigate(-1) が呼ばれる", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterEdit />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("戻る"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("センター一覧へ戻るボタンで CenterManage へナビゲートする", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterEdit />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("センター一覧へ戻る"));
    expect(mockNavigate).toHaveBeenCalledWith(UrlPath.CenterManage);
  });

  it("管理者チェックボックスをトグルできる", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterEdit />
      </MemoryRouter>,
    );

    // 佐藤 健は初期状態で管理者（checked）
    const checkboxes = screen.getAllByRole("checkbox");
    const firstCheckbox = checkboxes[0];
    expect(firstCheckbox).toHaveAttribute("data-state", "checked");
    await user.click(firstCheckbox);
    expect(firstCheckbox).toHaveAttribute("data-state", "unchecked");
  });

  it("ゲスト追加シートでメンバーを追加できる", async () => {
    const { user } = setup(
      <MemoryRouter>
        <CenterEdit />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("ゲスト追加"));
    await user.type(screen.getByPlaceholderText("例: u123"), "u999");
    await user.type(screen.getByPlaceholderText("氏名"), "テスト ユーザー");
    await user.click(screen.getByText("追加"));

    await waitFor(() => {
      expect(screen.getByText("テスト ユーザー")).toBeInTheDocument();
    });
  });

  it("ゲストメンバーの削除ボタンで toast が表示される", async () => {
    const { toast } = await import("@/components/ui/sonner");
    const { user } = setup(
      <MemoryRouter>
        <CenterEdit />
      </MemoryRouter>,
    );

    const deleteButtons = screen.getAllByText("削除");
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });

  it("センター削除ボタンで toast 表示後 CenterManage へナビゲートする", async () => {
    const { toast } = await import("@/components/ui/sonner");
    const { user } = setup(
      <MemoryRouter>
        <CenterEdit />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("削除する"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(UrlPath.CenterManage);
    });
  });
});
