import { jest } from "@jest/globals";
import { screen, waitFor, within } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { ShareArea } from "./ShareArea";
import { SHARE_AREAS } from "@/config/shareAreaConfig";
import { userSliceReducer } from "@/redux/slices/userSlice";
import { sharedAreaSliceReducer } from "@/redux/slices/sharedAreaSlice";

// Layout / tooltip は共有モックを使う（react-router は jest.config の mapper で固定）。
// tooltip のモックは中身（TooltipContent）を描画しないため、ツールチップの文言は検証できない。
jest.mock("@/components/layout/Layout");
jest.mock("@/components/ui/tooltip");

// 非同期テストの読み方は test/README.md「7. 非同期テスト」を参照（② await user.click → ③ 検証）。
// カード押下で navigate される / window.open が呼ばれる、を検証する。
// navigate・window.open はクリックで同期的に呼ばれるため検証は waitFor 不要で直接 expect できる。
// （window.open は jest.spyOn で握りつぶし、実際に新規タブを開かせない）

// ShareArea が出す所属センターは、モックの 20 件（MOCK_MY_CENTER_AREAS）で、先頭 4 件が SHARE_AREAS。
// 件数はモックの都合で変わるため、件数ではなく、先頭の実データ（SHARE_AREAS）が出ていることを検証する。

// 共有された領域は、実際のモック DB（Box は呼ばない）から取得する。
// ログインユーザーを指定して、そのユーザーに見える領域を検証する。
//   u001      : 4 件（第2ソフトウェア開発センター 2 件 + 第3ネットワークセンター 2 件。うち 1 件は Box 上で見つからない）
//   mock-user : 9 件（絞り込み欄が出る件数）
//   ops-admin : 1 件（契約書）
const renderShareArea = (loginUserCd = "") =>
  setupWithStore(<ShareArea />, {
    reducers: { user: userSliceReducer, sharedArea: sharedAreaSliceReducer },
    preloadedState: {
      user: { ...userSliceReducer(undefined, { type: "init" }), loginUserCd },
    },
  });

const mockNavigate = (
  globalThis as unknown as { mockNavigate: ReturnType<typeof jest.fn> }
).mockNavigate;

beforeEach(() => {
  mockNavigate.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

const myCenter = () => screen.getByRole("region", { name: "My Center" });
const myCollaboration = () =>
  screen.getByRole("region", { name: "My Collaboration" });

/** 共有された領域のカード（フォルダ名から引く） */
const findSharedCard = async (folderName: string) => {
  const title = await within(myCollaboration()).findByText(folderName);
  return title.closest("li") as HTMLElement;
};

describe("ShareArea: My Center（所属・ゲスト）", () => {
  it("先頭の領域の folderName と label を表示する", () => {
    renderShareArea();
    for (const area of SHARE_AREAS) {
      expect(within(myCenter()).getByText(area.folderName)).toBeInTheDocument();
      expect(within(myCenter()).getByText(area.label)).toBeInTheDocument();
    }
  });

  it("isGuest の領域には『ゲスト』バッジを表示する", () => {
    renderShareArea();
    const guest = SHARE_AREAS.find((a) => a.isGuest);
    expect(guest).toBeDefined();
    const card = within(myCenter())
      .getByText(guest!.folderName)
      .closest("li") as HTMLElement;
    expect(within(card).getByText("ゲスト")).toBeInTheDocument();
    // ゲストでない領域には出ない
    const normal = SHARE_AREAS.find((a) => !a.isGuest)!;
    const normalCard = within(myCenter())
      .getByText(normal.folderName)
      .closest("li") as HTMLElement;
    expect(within(normalCard).queryByText("ゲスト")).not.toBeInTheDocument();
  });

  it("管理者用のセンターメンバー一覧ボタンを、領域ごとに表示する", () => {
    renderShareArea();
    const settings = within(myCenter()).getAllByLabelText("コラボレーション設定");
    expect(within(myCenter()).getAllByLabelText("センターメンバー一覧")).toHaveLength(
      settings.length,
    );
  });

  it("コラボレーション設定ボタンで SS 画面へ navigate する", async () => {
    const { user } = renderShareArea();
    const buttons = within(myCenter()).getAllByLabelText("コラボレーション設定");
    await user.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/job/ShareArea/${SHARE_AREAS[0].boxFolderId}`,
    );
  });

  it("Box ブラウザボタンで app.box.com を開く", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const { user } = renderShareArea();
    const buttons = within(myCenter()).getAllByLabelText("Box ブラウザ");
    await user.click(buttons[0]);
    expect(openSpy).toHaveBeenCalledWith(
      `https://app.box.com/folder/${SHARE_AREAS[0].boxFolderId}`,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("Box Drive ボタンで jclUrl を開く", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const { user } = renderShareArea();
    const buttons = within(myCenter()).getAllByLabelText("Box Drive");
    await user.click(buttons[0]);
    expect(openSpy).toHaveBeenCalledWith(
      SHARE_AREAS[0].jclUrl,
      "_blank",
      "noopener,noreferrer",
    );
  });
});

describe("ShareArea: 区分けの開閉", () => {
  it("見出しのボタンで、区分けごとに折りたためる（もう一方は影響を受けない）", async () => {
    const { user } = renderShareArea("u001");
    await findSharedCard("見積資料");

    const centerToggle = within(myCenter()).getByRole("button", { name: "My Center" });
    expect(centerToggle).toHaveAttribute("aria-expanded", "true");

    await user.click(centerToggle);
    expect(centerToggle).toHaveAttribute("aria-expanded", "false");
    expect(within(myCenter()).queryByText(SHARE_AREAS[0].folderName)).not.toBeInTheDocument();
    // My Collaboration は開いたまま
    expect(within(myCollaboration()).getByText("見積資料")).toBeInTheDocument();

    await user.click(centerToggle);
    expect(within(myCenter()).getByText(SHARE_AREAS[0].folderName)).toBeInTheDocument();
  });
});

describe("ShareArea: My Collaboration（共有された領域）", () => {
  it("共有がなければ、空の案内を出す（取得前には出さない）", async () => {
    renderShareArea("nobody");
    expect(
      screen.queryByText("共有されている領域はありません。"),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("共有されている領域はありません。"),
    ).toBeInTheDocument();
  });

  it("ログインユーザーが未設定（開発中）でも、既定のモックユーザーの共有を出す", async () => {
    renderShareArea("");
    await waitFor(() =>
      expect(within(myCollaboration()).getAllByRole("listitem").length).toBeGreaterThan(0),
    );
  });

  it("ユーザー宛て・グループ宛ての共有を、フォルダごとのカードで出す。所属センター宛ては出さない", async () => {
    renderShareArea("u001");
    await findSharedCard("見積資料");
    const collab = within(myCollaboration());
    expect(collab.getAllByRole("listitem")).toHaveLength(4);
    for (const name of ["見積資料", "契約書", "設計図", "検証環境の手順書"]) {
      expect(collab.getByText(name)).toBeInTheDocument();
    }
    expect(collab.queryByText(/共有メモ/)).not.toBeInTheDocument();
  });

  it("センターのコード（英字）とフォルダ名を『コード › フォルダ名』で、センターの表示名をピルで出す", async () => {
    renderShareArea("u001");
    const card = within(await findSharedCard("契約書"));
    expect(card.getByText("JCLGD2SWDV")).toBeInTheDocument();
    expect(card.getByText("第2ソフトウェア開発センター")).toBeInTheDocument();
  });

  it("フルパスを、スクリーンリーダー用の文字で持つ（途中のパスは画面にはツールチップでだけ出る）", async () => {
    renderShareArea("u001");
    const card = within(await findSharedCard("契約書"));
    expect(
      card.getByText("（JCLGD2SWDV › 2024年度 › 法務 › 契約書）"),
    ).toBeInTheDocument();
  });

  it("同じフォルダにユーザー宛て(editor)とグループ宛て(viewer)があれば、強い方のロールを出す", async () => {
    renderShareArea("u001");
    const estimate = within(await findSharedCard("見積資料"));
    expect(estimate.getByText("編集者")).toBeInTheDocument();
    expect(estimate.queryByText("閲覧者")).not.toBeInTheDocument();
    const contract = within(await findSharedCard("契約書"));
    expect(contract.getByText("閲覧者")).toBeInTheDocument();
  });

  it("コラボレーション設定のボタンは、共有された領域には出さない", async () => {
    renderShareArea("u001");
    await findSharedCard("見積資料");
    expect(
      within(myCollaboration()).queryByLabelText("コラボレーション設定"),
    ).not.toBeInTheDocument();
  });

  it("見つからない領域は、メッセージを出してボタンを無効にする", async () => {
    renderShareArea("u001");
    const missing = within(await findSharedCard("検証環境の手順書"));
    expect(missing.getByText("Box 上で見つかりません")).toBeInTheDocument();
    expect(missing.getByLabelText("Box ブラウザ")).toBeDisabled();
    expect(missing.getByLabelText("Box Drive")).toBeDisabled();
    // 見つかる領域は有効
    const found = within(await findSharedCard("見積資料"));
    expect(found.getByLabelText("Box ブラウザ")).toBeEnabled();
  });

  it("Box ブラウザはフォルダ ID で、Box Drive は保存した経路から作った URL で開く", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const { user } = renderShareArea("ops-admin");
    // ops-admin に見えるのは 契約書 だけ（所属外センター宛て）
    const card = within(await findSharedCard("契約書"));

    await user.click(card.getByLabelText("Box ブラウザ"));
    expect(openSpy).toHaveBeenLastCalledWith(
      "https://app.box.com/folder/370710000002",
      "_blank",
      "noopener,noreferrer",
    );

    await user.click(card.getByLabelText("Box Drive"));
    expect(openSpy).toHaveBeenLastCalledWith(
      `/launch/box-drive?path=${encodeURIComponent("JCLGD2SWDV/2024年度/法務/契約書")}`,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("画面を開いたときに、ログインユーザーで一覧を取得する", async () => {
    const { store } = renderShareArea("u001");
    await waitFor(() => expect(store.getState().sharedArea.loaded).toBe(true));
    expect(store.getState().sharedArea.items).toHaveLength(4);
  });

  describe("絞り込み", () => {
    it("件数が少ないときは、絞り込み欄を出さない", async () => {
      renderShareArea("u001");
      await findSharedCard("見積資料");
      expect(
        screen.queryByLabelText("My Collaboration を絞り込み"),
      ).not.toBeInTheDocument();
    });

    it("件数が多いときは絞り込み欄を出し、センターのコード・表示名・フォルダ名で絞り込める", async () => {
      const { user } = renderShareArea("mock-user");
      await waitFor(() =>
        expect(within(myCollaboration()).getAllByRole("listitem")).toHaveLength(9),
      );
      const input = screen.getByLabelText("My Collaboration を絞り込み");

      // センターのコード
      await user.type(input, "JCLGD3NW");
      expect(within(myCollaboration()).getAllByRole("listitem")).toHaveLength(4);

      // センターの表示名
      await user.clear(input);
      await user.type(input, "第2ソフトウェア");
      expect(within(myCollaboration()).getAllByRole("listitem")).toHaveLength(5);

      // フォルダ名
      await user.clear(input);
      await user.type(input, "請求書");
      expect(within(myCollaboration()).getAllByRole("listitem")).toHaveLength(1);
    });

    it("途中のパスは絞り込みの対象外で、一致がなければ案内を出す", async () => {
      const { user } = renderShareArea("mock-user");
      await waitFor(() =>
        expect(within(myCollaboration()).getAllByRole("listitem")).toHaveLength(9),
      );
      // 「経理」は 請求書 の途中のパスにだけ含まれる
      await user.type(screen.getByLabelText("My Collaboration を絞り込み"), "経理");
      expect(screen.getByText("一致する領域はありません。")).toBeInTheDocument();
    });

    it("My Collaboration を折りたたむと、絞り込み欄も隠れる", async () => {
      const { user } = renderShareArea("mock-user");
      await waitFor(() =>
        expect(within(myCollaboration()).getAllByRole("listitem")).toHaveLength(9),
      );
      await user.click(
        within(myCollaboration()).getByRole("button", { name: "My Collaboration" }),
      );
      expect(
        screen.queryByLabelText("My Collaboration を絞り込み"),
      ).not.toBeInTheDocument();
    });
  });
});
