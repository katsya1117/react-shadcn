import { jest } from "@jest/globals";
import type { CenterListItem } from "@/api";
import {
  centerSliceReducer,
  getCenterList,
} from "@/redux/slices/centerSlice";
import { toast } from "@/components/ui/sonner";
import { screen, waitFor } from "@testing-library/react";
import { createMockPagination, setupWithStore } from "@test-utils";
import { CenterManage } from "./CenterManage";

const mockNavigate = (globalThis as any).mockNavigate as jest.Mock;

const reducers = { center: centerSliceReducer };
const baseCenterState = centerSliceReducer(undefined, { type: "@@INIT" });
const basePreloadedState = { center: baseCenterState };

// 非同期テストの読み方は test/README.md「7. 非同期テスト」を参照（① 準備 → ② 操作 → ③ 検証）。
// getCenterList thunk を「アクションを返すだけの jest.fn」に差し替える（実 API は叩かない）。
// → 検索操作で getCenterList が「どんな引数で」dispatch されたかを検証できる。
jest.mock("@/redux/slices/centerSlice", () => {
  const actual = jest.requireActual("@/redux/slices/centerSlice");
  return {
    ...actual,
    getCenterList: jest.fn((arg: unknown) => ({
      type: "getCenterList",
      payload: arg,
    })),
  };
});

jest.mock("@/components/ui/sonner");

jest.mock("@/pages/CenterTabsShell", () => ({
  __esModule: true,
  CenterTabsShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-shell">{children}</div>
  ),
}));

// Pagination は共有モックを使う（クリックで onHandle({ page: 2 }) を呼ぶ）。
jest.mock("@/components/common/Pagination/Pagination");

const mockCenter = (override: Partial<CenterListItem> = {}): CenterListItem => ({
  center_cd: "c001",
  center_name: "東京センター",
  folder_name: "/tokyo",
  members: 4,
  type: "所属",
  site: "横浜",
  ...override,
});

const searchedState = (
  items: CenterListItem[] | undefined,
  searchCondition = {},
) => ({
  center: {
    ...baseCenterState,
    searchResultDisp: { settingSearched: true },
    list: {
      searchCondition,
      data: items
        ? { data: items, items, pagination: createMockPagination() }
        : undefined,
    },
  },
});

describe("CenterManage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).mockLocation = {
      pathname: "/manage/Center",
      search: "",
      hash: "",
      state: null,
      key: "default",
    };
  });

  it("初期表示（未検索）のときは、検索結果やメッセージが表示されない", () => {
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: basePreloadedState,
    });

    expect(screen.queryByText("検索結果")).not.toBeInTheDocument();
    expect(
      screen.queryByText("該当するセンターが見つかりませんでした。"),
    ).not.toBeInTheDocument();
  });

  it("検索ボタンで getCenterList を dispatch する", async () => {
    const { user, dispatchSpy } = setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: basePreloadedState,
    });
    await user.type(screen.getByLabelText("センター名"), "東京");
    await user.type(screen.getByLabelText("メンバー"), "佐藤, 田中");

    await user.click(screen.getByText("検索"));

    expect(getCenterList).toHaveBeenCalledWith(
      expect.objectContaining({
        center_name: "東京",
        user_list: ["佐藤", "田中"],
        page: 1,
      }),
    );
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it("クリアで入力欄が空になる", async () => {
    const { user } = setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: basePreloadedState,
    });
    await user.type(screen.getByLabelText("センター名"), "東京");

    await user.click(screen.getByText("クリア"));

    expect(screen.getByLabelText("センター名")).toHaveValue("");
  });

  it("保存済みの検索条件を入力欄に復元する", () => {
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: searchedState([mockCenter()], {
        center_name: "大阪",
        user_list: ["佐藤", "田中"],
      }),
    });

    expect(screen.getByLabelText("センター名")).toHaveValue("大阪");
    expect(screen.getByLabelText("メンバー")).toHaveValue("佐藤,田中");
  });

  it("検索結果なしのメッセージを表示する", () => {
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: searchedState([]),
    });

    expect(
      screen.getByText("該当するセンターが見つかりませんでした。"),
    ).toBeInTheDocument();
  });

  it("data が undefined のときは検索結果なしメッセージを表示する", () => {
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: searchedState(undefined),
    });

    expect(
      screen.getByText("該当するセンターが見つかりませんでした。"),
    ).toBeInTheDocument();
  });

  it("検索結果を表示し、選択リンクが CenterEdit を指す", () => {
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: searchedState([
        mockCenter(),
        mockCenter({ center_cd: "c002", center_name: "大阪DR", members: 2 }),
      ]),
    });

    expect(screen.getByText("検索結果")).toBeInTheDocument();
    expect(screen.getByText("東京センター")).toBeInTheDocument();
    expect(screen.getByText("大阪DR")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "選択" });
    expect(links[0]).toHaveAttribute("href", "/manage/Center/c001");
    expect(links[1]).toHaveAttribute("href", "/manage/Center/c002");
  });

  it("ページ移動で検索条件を引き継いで getCenterList を dispatch する", async () => {
    const { user } = setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: searchedState([mockCenter()], { center_name: "東京" }),
    });

    await user.click(screen.getByTestId("pagination-mock"));

    expect(getCenterList).toHaveBeenCalledWith({
      center_name: "東京",
      page: 2,
    });
  });

  it("削除完了stateがあるときはtoastを表示し、stateをクリアする", async () => {
    (globalThis as any).mockLocation.state = { deletedCenterCd: "c001" };
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: basePreloadedState,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("センターc001を削除しました");
    });
    expect(mockNavigate).toHaveBeenCalledWith(".", {
      replace: true,
      state: null,
    });
  });

  it("検索済みで戻ってきたときは、保存済みの検索条件で一覧を再取得する", () => {
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: searchedState([mockCenter()], { center_name: "東京" }),
    });

    expect(getCenterList).toHaveBeenCalledWith({ center_name: "東京" });
  });

  it("未検索のときはマウント時に一覧を再取得しない", () => {
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: basePreloadedState,
    });

    expect(getCenterList).not.toHaveBeenCalled();
  });

  // 実API確認後に仕様が変わる可能性あり（CenterManage.tsx の TODO を参照）
  it("再取得結果が0件で page > 1 のときは 1 ページ目で取り直す", async () => {
    (getCenterList as unknown as jest.Mock).mockImplementationOnce(
      () => () =>
        Promise.resolve({
          meta: { requestStatus: "fulfilled" },
          payload: { items: [] },
        }),
    );
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: searchedState([mockCenter()], {
        center_name: "東京",
        page: 3,
      }),
    });

    await waitFor(() => {
      expect(getCenterList).toHaveBeenNthCalledWith(2, {
        center_name: "東京",
        page: 1,
      });
    });
  });

  it("再取得結果が0件でも page が 1 のときは取り直さない", async () => {
    (getCenterList as unknown as jest.Mock).mockImplementationOnce(
      () => () =>
        Promise.resolve({
          meta: { requestStatus: "fulfilled" },
          payload: { items: [] },
        }),
    );
    setupWithStore(<CenterManage />, {
      reducers,
      preloadedState: searchedState([mockCenter()], { page: 1 }),
    });

    await waitFor(() => {
      expect(getCenterList).toHaveBeenCalledTimes(1);
    });
  });
});
