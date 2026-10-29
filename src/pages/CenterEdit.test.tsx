import { jest } from "@jest/globals";
import type { CenterInfo } from "@/api";
import { toast } from "@/components/ui/sonner";
import { UrlPath } from "@/constants/UrlPath";
import {
  centerSliceReducer,
  getCenterInfo,
  removeCenter,
  updateCenterInfo,
} from "@/redux/slices/centerSlice";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { CenterEdit } from "./CenterEdit";

const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;

jest.mock("@/pages/CenterTabsShell", () => ({
  __esModule: true,
  CenterTabsShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-shell">{children}</div>
  ),
}));

// ConfirmButton / sonner / LoadingOverlay は共有モックを使う。
jest.mock("@/components/common/Confirm/ConfirmButton");
jest.mock("@/components/common/LoadingOverlay");
jest.mock("@/components/ui/sonner");

// thunk を「アクションを返すだけの jest.fn」に差し替える（実 API は叩かない）。
jest.mock("@/redux/slices/centerSlice", () => {
  const actual = jest.requireActual("@/redux/slices/centerSlice");
  return {
    ...actual,
    getCenterInfo: jest.fn((arg: unknown) => ({
      type: "getCenterInfo",
      payload: arg,
    })),
    updateCenterInfo: jest.fn((arg: unknown) => ({
      type: "updateCenterInfo",
      payload: arg,
    })),
    removeCenter: jest.fn((arg: unknown) => ({
      type: "removeCenter",
      payload: arg,
    })),
  };
});

// 非同期テストの読み方は test/README.md「7. 非同期テスト」を参照（① 準備 → ② 操作 → ③ 待つ）。
// コンポーネントは `await dispatch(thunk(...)).unwrap()` と書くので、dispatchSpy を乗っ取り
// 「Promise であり .unwrap() を持つ」オブジェクトを返して成功 / 失敗を偽装する（UserEdit.test と同じ手法）。
const fakeThunk = (type: string, result: "resolve" | { reject: unknown }) => {
  const impl = ((action: any) => {
    if (action?.type === type) {
      return Object.assign(Promise.resolve({}), {
        unwrap: () =>
          result === "resolve"
            ? Promise.resolve({ ok: true })
            : Promise.reject(result.reject),
      });
    }
    return Promise.resolve(action);
  }) as any;
  return impl;
};

const baseCenterState = centerSliceReducer(undefined, { type: "@@INIT" });
const tokyo: CenterInfo = {
  center_cd: "c001",
  center_name: "東京センター",
  folder_name: "/tokyo",
  type: "所属",
  site: "横浜",
};

const renderEdit = (target: CenterInfo | undefined = tokyo) =>
  setupWithStore(<CenterEdit />, {
    reducers: { center: centerSliceReducer },
    preloadedState: { center: { ...baseCenterState, target } },
  });

describe("CenterEdit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).mockParams = { center_cd: "c001" };
  });

  afterEach(() => {
    (globalThis as any).mockParams = {};
  });

  it("初期表示で getCenterInfo を dispatch する", () => {
    const { dispatchSpy } = renderEdit();

    expect(getCenterInfo).toHaveBeenCalledWith("c001");
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "getCenterInfo" }),
    );
  });

  it("取得したセンター情報がフォームに表示される", () => {
    renderEdit();

    expect(screen.getByText("東京センター")).toBeInTheDocument();
    expect(screen.getByText("センターコード: c001")).toBeInTheDocument();
    expect(screen.getByLabelText("センター名")).toHaveValue("東京センター");
    expect(screen.getByLabelText("拠点")).toHaveValue("横浜");
    expect(screen.getByLabelText("フォルダ名")).toHaveValue("/tokyo");
    expect(screen.getByLabelText("タイプ")).toHaveValue("所属");
  });

  it("別センターの取得結果が残っていても表示しない（取得失敗時はデフォルト表示）", () => {
    (globalThis as any).mockParams = { center_cd: "x999" };
    renderEdit();

    expect(screen.getByText("センター編集")).toBeInTheDocument();
    expect(screen.getByText("センターコード: x999")).toBeInTheDocument();
    expect(screen.getByLabelText("センター名")).toHaveValue("");
  });

  it("center_cd が無いときは '-' を表示する", () => {
    (globalThis as any).mockParams = {};
    renderEdit(undefined);

    expect(screen.getByText("センターコード: -")).toBeInTheDocument();
    expect(getCenterInfo).not.toHaveBeenCalled();
  });

  it("戻るボタンで navigate(-1) が呼ばれる", async () => {
    const { user } = renderEdit();

    await user.click(screen.getByText("戻る"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("センター一覧へ戻るボタンで CenterManage へナビゲートする", async () => {
    const { user } = renderEdit();

    await user.click(screen.getByText("センター一覧へ戻る"));
    expect(mockNavigate).toHaveBeenCalledWith(UrlPath.CenterManage);
  });

  it("センター名が空のときは保存せず toast.error を出す", async () => {
    const { user } = renderEdit();
    fireEvent.change(screen.getByLabelText("センター名"), {
      target: { value: "  " },
    });

    await user.click(screen.getAllByText("保存")[0]);

    expect(toast.error).toHaveBeenCalledWith("センター名を入力してください");
    expect(updateCenterInfo).not.toHaveBeenCalled();
  });

  it("保存成功で updateCenterInfo を dispatch し toast.success を出す", async () => {
    const { user, dispatchSpy } = renderEdit();
    fireEvent.change(screen.getByLabelText("センター名"), {
      target: { value: " 新東京センター " },
    });
    dispatchSpy.mockImplementation(fakeThunk("updateCenterInfo", "resolve"));

    await user.click(screen.getAllByText("保存")[0]);

    await waitFor(() => {
      expect(updateCenterInfo).toHaveBeenCalledWith({
        centerCd: "c001",
        params: {
          center_name: "新東京センター",
          folder_name: "/tokyo",
          site: "横浜",
        },
      });
      expect(toast.success).toHaveBeenCalledWith("保存しました");
      // 保存後に最新の情報を再取得する
      expect(getCenterInfo).toHaveBeenCalledTimes(2);
    });
  });

  it("保存失敗でエラーメッセージを toast.error に出す", async () => {
    const { user, dispatchSpy } = renderEdit();
    dispatchSpy.mockImplementation(
      fakeThunk("updateCenterInfo", { reject: "更新エラー" }),
    );

    await user.click(screen.getAllByText("保存")[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("更新エラー");
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("センター削除で removeCenter を dispatch し、削除済み state 付きで一覧へ戻る", async () => {
    const { user, dispatchSpy } = renderEdit();
    dispatchSpy.mockImplementation(fakeThunk("removeCenter", "resolve"));

    await user.click(screen.getByText("削除する"));

    await waitFor(() => {
      expect(removeCenter).toHaveBeenCalledWith("c001");
      expect(mockNavigate).toHaveBeenCalledWith(UrlPath.CenterManage, {
        replace: true,
        state: { deletedCenterCd: "c001" },
      });
    });
  });

  it("センター削除失敗で toast.error を出し、遷移しない", async () => {
    const { user, dispatchSpy } = renderEdit();
    dispatchSpy.mockImplementation(
      fakeThunk("removeCenter", { reject: new Error("boom") }),
    );

    await user.click(screen.getByText("削除する"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("削除に失敗しました");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ---- メンバー管理（API 未接続のローカル state）---- //

  it("ゲストメンバーを管理者にすると名前に（ゲスト）が付く", async () => {
    const { user } = renderEdit();

    // u099 外部 太郎 は guestLabel="ゲスト"、index 6 (7番目メンバー)
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[6]);

    expect(screen.getByText(/外部 太郎（ゲスト）/)).toBeInTheDocument();
  });

  it("管理者チェックボックスをトグルできる", async () => {
    const { user } = renderEdit();

    // 佐藤 健は初期状態で管理者（checked）
    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    expect(firstCheckbox).toHaveAttribute("data-state", "checked");
    await user.click(firstCheckbox);
    expect(firstCheckbox).toHaveAttribute("data-state", "unchecked");
  });

  it("ゲスト追加シートでメンバーを追加できる", async () => {
    const { user } = renderEdit();

    await user.click(screen.getByText("ゲスト追加"));
    await user.type(screen.getByPlaceholderText("例: u123"), "u999");
    await user.type(screen.getByPlaceholderText("氏名"), "テスト ユーザー");
    await user.click(screen.getByText("追加"));

    await waitFor(() => {
      expect(screen.getByText("テスト ユーザー")).toBeInTheDocument();
    });
  });

  it("ゲストメンバーの削除ボタンで toast が表示される", async () => {
    const { user } = renderEdit();

    await user.click(screen.getAllByText("削除")[0]);

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
});
