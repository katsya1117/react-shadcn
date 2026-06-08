import { jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { setup } from "@test-utils";
import { ShareArea } from "./ShareArea";
import { SHARE_AREAS } from "@/config/shareAreaConfig";

// Layout / tooltip / react-router は moduleNameMapper でモックに寄せている。
// ShareArea 自身は ./ShareArea 相対 import で実体を使う。

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
  it("全ての領域の folderName を表示する", () => {
    setup(<ShareArea />);
    for (const area of SHARE_AREAS) {
      expect(screen.getByText(area.folderName)).toBeInTheDocument();
    }
  });

  it("isGuest の領域には『ゲスト』バッジを表示する", () => {
    setup(<ShareArea />);
    const guestCount = SHARE_AREAS.filter((a) => a.isGuest).length;
    expect(screen.getAllByText("ゲスト")).toHaveLength(guestCount);
  });

  it("管理者用のセンターメンバー一覧ボタンを表示する", () => {
    setup(<ShareArea />);
    expect(
      screen.getAllByLabelText("センターメンバー一覧").length,
    ).toBe(SHARE_AREAS.length);
  });

  it("コラボレーション設定ボタンで SS 画面へ navigate する", async () => {
    const { user } = setup(<ShareArea />);
    const buttons = screen.getAllByLabelText("コラボレーション設定");
    await user.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/job/ShareArea/${SHARE_AREAS[0].boxFolderId}`,
    );
  });

  it("Box ブラウザボタンで app.box.com を開く", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const { user } = setup(<ShareArea />);
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
    const { user } = setup(<ShareArea />);
    const buttons = screen.getAllByLabelText("Box Drive");
    await user.click(buttons[0]);
    expect(openSpy).toHaveBeenCalledWith(
      SHARE_AREAS[0].jclUrl,
      "_blank",
      "noopener,noreferrer",
    );
  });
});
