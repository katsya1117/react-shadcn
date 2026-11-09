import { jest } from "@jest/globals";
import { screen, waitFor, within } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { ShareArea } from "./ShareArea";
import { SHARE_AREAS } from "@/config/shareAreaConfig";
import { userSliceReducer } from "@/redux/slices/userSlice";
import { sharedAreaSliceReducer } from "@/redux/slices/sharedAreaSlice";

// Layout / tooltip は共有モックを使う（react-router は jest.config の mapper で固定）。
jest.mock("@/components/layout/Layout");
jest.mock("@/components/ui/tooltip");

// 非同期テストの読み方は test/README.md「7. 非同期テスト」を参照（② await user.click → ③ 検証）。
// カード押下で navigate される / window.open が呼ばれる、を検証する。
// navigate・window.open はクリックで同期的に呼ばれるため検証は waitFor 不要で直接 expect できる。
// （window.open は jest.spyOn で握りつぶし、実際に新規タブを開かせない）

// 共有された領域は、実際のモック DB（Box は呼ばない）から取得する。
// ログインユーザーを指定して、そのユーザーに見える領域を検証する。
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

describe("ShareArea", () => {
  it("MyCenter と MyCollaboration の 2 つの区分けを、見出しと件数つきで出す", async () => {
    renderShareArea("u001");
    const center = screen.getByRole("region", { name: /所属センター/ });
    expect(center).toHaveTextContent("My Center");
    expect(center).toHaveTextContent(String(SHARE_AREAS.length));

    const collab = await screen.findByRole("region", { name: /共有された領域/ });
    expect(collab).toHaveTextContent("My Collaboration");
    // 共有されたフォルダのカードは、MyCollaboration の中だけにある
    expect(collab).toHaveTextContent("見積資料");
    expect(collab).toHaveTextContent("JCLGD2SWDV");
    expect(center).not.toHaveTextContent("見積資料");
  });

  it("全ての領域の folderName を表示する", () => {
    renderShareArea();
    for (const area of SHARE_AREAS) {
      expect(screen.getByText(area.folderName)).toBeInTheDocument();
    }
  });

  it("isGuest の領域には『ゲスト』バッジを表示する", () => {
    renderShareArea();
    const guestCount = SHARE_AREAS.filter((a) => a.isGuest).length;
    expect(screen.getAllByText("ゲスト")).toHaveLength(guestCount);
  });

  it("管理者用のセンターメンバー一覧ボタンを表示する", () => {
    renderShareArea();
    expect(
      screen.getAllByLabelText("センターメンバー一覧").length,
    ).toBe(SHARE_AREAS.length);
  });

  it("コラボレーション設定ボタンで SS 画面へ navigate する", async () => {
    const { user } = renderShareArea();
    const buttons = screen.getAllByLabelText("コラボレーション設定");
    await user.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/job/ShareArea/${SHARE_AREAS[0].boxFolderId}`,
    );
  });

  it("Box ブラウザボタンで app.box.com を開く", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const { user } = renderShareArea();
    const buttons = screen.getAllByLabelText("Box ブラウザ");
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
    const buttons = screen.getAllByLabelText("Box Drive");
    await user.click(buttons[0]);
    expect(openSpy).toHaveBeenCalledWith(
      SHARE_AREAS[0].jclUrl,
      "_blank",
      "noopener,noreferrer",
    );
  });

  describe("共有された領域", () => {
    it("ログインユーザーが未設定（開発中）でも、既定のモックユーザーの共有を出す", async () => {
      renderShareArea("");
      const collab = await screen.findByRole("region", { name: /共有された領域/ });
      await waitFor(() => expect(collab.querySelectorAll("li").length).toBeGreaterThan(0));
    });

    it("親のセンターごとに小見出しをつけて、センターの区分けはすべて出す", async () => {
      renderShareArea("mock-user");
      const collab = await screen.findByRole("region", { name: /共有された領域/ });
      const centers = await within(collab).findAllByRole("region");
      expect(centers).toHaveLength(2);
      expect(centers[0]).toHaveTextContent("第2ソフトウェア開発センター");
      expect(centers[0]).toHaveTextContent("JCLGD2SWDV");
      expect(centers[1]).toHaveTextContent("第3ネットワークセンター");
      // センターの表示名は、カードではなく小見出しに出る
      expect(within(centers[1]).getAllByText("第3ネットワークセンター")).toHaveLength(1);
    });

    it("センターごとに最初は 4 件だけ出し、『他 N 件を表示』で広げる。他のセンターは影響を受けない", async () => {
      const { user } = renderShareArea("mock-user");
      const collab = await screen.findByRole("region", { name: /共有された領域/ });
      const [first, second] = await within(collab).findAllByRole("region");
      // 第2ソフトウェア開発センターは 5 件 → 4 件 + 他 1 件
      expect(first.querySelectorAll("li")).toHaveLength(4);
      // 第3ネットワークセンターは 4 件 → 広げるボタンなし
      expect(second.querySelectorAll("li")).toHaveLength(4);
      expect(
        within(second).queryByRole("button", { name: /件を表示|折りたたむ/ }),
      ).not.toBeInTheDocument();

      await user.click(within(first).getByRole("button", { name: "他 1 件を表示" }));
      expect(first.querySelectorAll("li")).toHaveLength(5);
      expect(second.querySelectorAll("li")).toHaveLength(4);
      await user.click(within(first).getByRole("button", { name: "折りたたむ" }));
      expect(first.querySelectorAll("li")).toHaveLength(4);
    });

    it("絞り込みでは、一致するカードをすべて出し、一致のないセンターは出さない", async () => {
      const { user } = renderShareArea("mock-user");
      const collab = await screen.findByRole("region", { name: /共有された領域/ });
      await within(collab).findAllByRole("region");
      const input = screen.getByLabelText("共有された領域を絞り込み");

      // 「経理」を含むのは 請求書 だけ（第2ソフトウェア開発センターの、隠れていた 5 件目）
      await user.type(input, "経理");
      const regions = within(collab).getAllByRole("region");
      expect(regions).toHaveLength(1);
      expect(regions[0].querySelectorAll("li")).toHaveLength(1);
      expect(regions[0]).toHaveTextContent("請求書");
      expect(within(collab).queryByRole("button", { name: /件を表示/ })).not.toBeInTheDocument();

      await user.clear(input);
      await user.type(input, "存在しない名前");
      expect(screen.getByText("一致する領域はありません。")).toBeInTheDocument();
    });

    it("5 件以下のときは、絞り込みと『すべて表示』を出さない", async () => {
      renderShareArea("u001");
      await screen.findByText("見積資料");
      expect(screen.queryByLabelText("共有された領域を絞り込み")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /すべて表示/ })).not.toBeInTheDocument();
    });

    it("取得前は『ありません』を出さず、共有がなければ空の案内を出す", async () => {
      renderShareArea("nobody");
      expect(
        screen.queryByText("共有されている領域はありません。"),
      ).not.toBeInTheDocument();
      expect(
        await screen.findByText("共有されている領域はありません。"),
      ).toBeInTheDocument();
    });

    it("ユーザー宛て・グループ宛ての共有を、フォルダごとのカードで出す", async () => {
      renderShareArea("u001");
      // 見つからない状態のカードも含めて、センター名 › フォルダ名 のタイトルで出る
      expect(await screen.findByText("見積資料")).toBeInTheDocument();
      expect(screen.getByText("契約書")).toBeInTheDocument();
      expect(screen.getByText("設計図")).toBeInTheDocument();
      // 所属センター宛ての共有は、共有された領域には出ない
      expect(screen.queryByText(/共有メモ/)).not.toBeInTheDocument();
    });

    it("同じフォルダにユーザー宛て(editor)とグループ宛て(viewer)があれば、強い方のロールを出す", async () => {
      renderShareArea("u001");
      const title = await screen.findByText("見積資料");
      const card = title.closest("li") as HTMLElement;
      expect(card).toHaveTextContent("編集者");
      expect(card).not.toHaveTextContent("閲覧者");
    });

    it("センターの小見出しの下に、フォルダ名のカードを 2 段組で並べる", async () => {
      renderShareArea("u001");
      const title = await screen.findByText("見積資料");
      const card = title.closest("li") as HTMLElement;
      // 親のセンターの小見出しの区分けの中にある
      const group = card.closest("section") as HTMLElement;
      expect(group).toHaveTextContent("第2ソフトウェア開発センター");
      // カード自体には、センターの表示名を出さない
      expect(card).not.toHaveTextContent("第2ソフトウェア開発センター");
      // フルパスの先頭は、Box 上のフォルダ名（英字）
      expect(card).toHaveTextContent("JCLGD2SWDV › … › 案件A › 見積資料");
      // 2 段組（md 以上で 2 列）
      expect(card.parentElement).toHaveClass("md:grid-cols-2");
    });

    it("フルパスを出す。長いときは途中を … にして、全文は title に持つ", async () => {
      renderShareArea("u001");
      await screen.findByText("見積資料");
      // 4 つ以下はそのまま
      expect(
        screen.getByText("JCLGD2SWDV › 2024年度 › 法務 › 契約書"),
      ).toBeInTheDocument();
      // 長いものは省略（先頭 1 + … + 末尾 2）
      const abbreviated = screen.getByText(
        "JCLGD3NW › … › 旧版 › 検証環境の手順書",
      );
      expect(abbreviated).toHaveAttribute(
        "title",
        "JCLGD3NW › 2023年度 › インフラ › 運用 › 手順 › 検証環境 › 旧版 › 検証環境の手順書",
      );
    });

    it("コラボレーション設定のボタンは、共有された領域には出さない", async () => {
      renderShareArea("u001");
      await screen.findByText("見積資料");
      // 所属・ゲストのカードの分だけ
      expect(screen.getAllByLabelText("コラボレーション設定")).toHaveLength(
        SHARE_AREAS.length,
      );
    });

    it("見つからない領域は、メッセージを出してボタンを無効にする", async () => {
      renderShareArea("u001");
      await screen.findByText("見積資料");
      expect(screen.getByText(/Box 上で見つかりません/)).toBeInTheDocument();
      const disabled = screen
        .getAllByLabelText("Box ブラウザ")
        .filter((b) => (b as HTMLButtonElement).disabled);
      expect(disabled).toHaveLength(1);
    });

    it("Box ブラウザはフォルダ ID で、Box Drive は保存した経路から作った URL で開く", async () => {
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
      const { user } = renderShareArea("ops-admin");
      // ops-admin に見えるのは 契約書 だけ（所属外センター宛て）
      const title = await screen.findByText("契約書");
      const card = title.closest("li") as HTMLElement;
      expect(card).not.toBeNull();

      await user.click(
        card.querySelector('[aria-label="Box ブラウザ"]') as HTMLElement,
      );
      expect(openSpy).toHaveBeenLastCalledWith(
        "https://app.box.com/folder/370710000002",
        "_blank",
        "noopener,noreferrer",
      );

      await user.click(
        card.querySelector('[aria-label="Box Drive"]') as HTMLElement,
      );
      expect(openSpy).toHaveBeenLastCalledWith(
        `/launch/box-drive?path=${encodeURIComponent(
          "JCLGD2SWDV/2024年度/法務/契約書",
        )}`,
        "_blank",
        "noopener,noreferrer",
      );
    });

    it("画面を開いたときに、ログインユーザーで一覧を取得する", async () => {
      const { store } = renderShareArea("u001");
      await waitFor(() =>
        expect(store.getState().sharedArea.loaded).toBe(true),
      );
      expect(store.getState().sharedArea.items).toHaveLength(4);
    });
  });
});
