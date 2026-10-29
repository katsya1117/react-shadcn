import { jest } from "@jest/globals";
import { toast } from "@/components/ui/sonner";
import { UrlPath } from "@/constants/UrlPath";
import { centerSliceReducer, createCenter } from "@/redux/slices/centerSlice";
import { screen, waitFor } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { CenterCreate } from "./CenterCreate";

const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;

jest.mock("@/pages/CenterTabsShell", () => ({
  __esModule: true,
  CenterTabsShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-shell">{children}</div>
  ),
}));

jest.mock("@/components/common/LoadingOverlay");
jest.mock("@/components/ui/sonner");

jest.mock("@/redux/slices/centerSlice", () => {
  const actual = jest.requireActual("@/redux/slices/centerSlice");
  return {
    ...actual,
    createCenter: jest.fn((arg: unknown) => ({
      type: "createCenter",
      payload: arg,
    })),
  };
});

// 非同期テストの読み方は test/README.md「7. 非同期テスト」を参照。
// `await dispatch(createCenter(...)).unwrap()` を偽装するため、dispatchSpy を乗っ取る（UserEdit.test と同じ手法）。
const fakeCreate = (result: { resolve: string } | { reject: unknown }) =>
  ((action: any) => {
    if (action?.type === "createCenter") {
      return Object.assign(Promise.resolve({}), {
        unwrap: () =>
          "resolve" in result
            ? Promise.resolve(result.resolve)
            : Promise.reject(result.reject),
      });
    }
    return Promise.resolve(action);
  }) as any;

const renderCreate = () =>
  setupWithStore(<CenterCreate />, {
    reducers: { center: centerSliceReducer },
  });

describe("CenterCreate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("センター作成フォームが表示される", () => {
    renderCreate();

    expect(screen.getByText("センター作成")).toBeInTheDocument();
    expect(screen.getByLabelText("センター名")).toBeInTheDocument();
    expect(screen.getByLabelText("拠点")).toBeInTheDocument();
    expect(screen.getByLabelText("フォルダ名")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "作成" })).toBeInTheDocument();
  });

  it("センター名が空のときは作成せず toast.error を出す", async () => {
    const { user } = renderCreate();

    await user.click(screen.getByRole("button", { name: "作成" }));

    expect(toast.error).toHaveBeenCalledWith("センター名を入力してください");
    expect(createCenter).not.toHaveBeenCalled();
  });

  it("作成成功で createCenter を dispatch し、作成したセンターの編集画面へ遷移する", async () => {
    const { user, dispatchSpy } = renderCreate();
    dispatchSpy.mockImplementation(fakeCreate({ resolve: "c010" }));
    await user.type(screen.getByLabelText("センター名"), " 福岡センター ");
    await user.type(screen.getByLabelText("拠点"), "福岡");
    await user.type(screen.getByLabelText("フォルダ名"), "/fukuoka");

    await user.click(screen.getByRole("button", { name: "作成" }));

    await waitFor(() => {
      expect(createCenter).toHaveBeenCalledWith({
        center_name: "福岡センター",
        site: "福岡",
        folder_name: "/fukuoka",
      });
      expect(toast.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        UrlPath.CenterEdit.replace(":center_cd", "c010"),
      );
    });
  });

  it("作成失敗でエラーメッセージを toast.error に出し、遷移しない", async () => {
    const { user, dispatchSpy } = renderCreate();
    dispatchSpy.mockImplementation(fakeCreate({ reject: "同名のセンターが既に存在します。" }));
    await user.type(screen.getByLabelText("センター名"), "東京センター");

    await user.click(screen.getByRole("button", { name: "作成" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("同名のセンターが既に存在します。");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
