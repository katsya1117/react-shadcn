import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { act, renderHook } from "@testing-library/react";

import { configureBoxDevToken } from "@/lib/boxDevToken";
import { ssSliceReducer } from "@/redux/slices/ssSlice";
import { userSliceReducer } from "@/redux/slices/userSlice";
import type { BoxFolder } from "@/types/BoxUiElements";
import { useBoxExplorer } from "./useBoxExplorer";

// Box の Explorer を画面に出す側（SDK の生成・show・hide・イベント購読・トークンの決定）の検証。
// window.Box を偽物に差し替えるだけで、画面（SS）もルーターも要らない。
// フォルダ移動の状態そのもの（履歴・戻る/進む・復元の判定）は useFolderNavigation.test.tsx で検証している。
// ここでは「SDK のイベントが、その状態に届くこと」「届いた状態が、SDK への指示（navigateTo）になること」を見る。

const ROOT = "R";

const folder = (id: string): BoxFolder => ({
  id,
  type: "folder",
  name: `name-${id}`,
  path_collection: { entries: [{ id: "0", name: "All Files" }] },
});

type FakeExplorer = {
  show: jest.Mock;
  hide: jest.Mock;
  addListener: jest.Mock;
  removeAllListeners: jest.Mock;
  navigateTo: jest.Mock;
};

/** window.Box.ContentExplorer を、生成されたインスタンスを記録する偽物に差し替える */
const installExplorer = (hide: () => void = () => {}) => {
  const instances: FakeExplorer[] = [];
  (window as unknown as { Box: unknown }).Box = {
    ContentExplorer: class {
      show = jest.fn();
      hide = jest.fn(hide);
      addListener = jest.fn();
      removeAllListeners = jest.fn();
      navigateTo = jest.fn();
      constructor() {
        instances.push(this as unknown as FakeExplorer);
      }
    },
  };
  return instances;
};

const loggedIn = (accessToken = "test-token") => ({
  isLogin: true,
  box: {
    boxAccountId: "acc1",
    token: { accessToken },
    tokenDt: Date.now(),
  },
});

type SetupOptions = {
  /** Redux のユーザー状態の上書き（既定は未ログイン・トークンなし） */
  user?: Record<string, unknown>;
  restoreTargetId?: string;
};

const setupHook = ({ user, restoreTargetId }: SetupOptions = {}) => {
  const store = configureStore({
    reducer: { ss: ssSliceReducer, user: userSliceReducer },
    preloadedState: {
      ss: ssSliceReducer(undefined, { type: "@@INIT" }),
      user: {
        ...userSliceReducer(undefined, { type: "@@INIT" }),
        ...user,
      } as never,
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(
    () =>
      useBoxExplorer({
        rootFolderId: ROOT,
        initialFolder: restoreTargetId
          ? { id: restoreTargetId, name: "", pathCollection: { entries: [] } }
          : { id: ROOT, name: "", pathCollection: { entries: [] } },
        savedHistory: restoreTargetId ? [ROOT, restoreTargetId] : [ROOT],
        savedIndex: restoreTargetId ? 1 : 0,
        restoreTargetId,
      }),
    { wrapper },
  );
};

/** addListener("navigate", fn) で登録された fn を取り出す */
const navigateListener = (explorer: FakeExplorer) =>
  explorer.addListener.mock.calls.find((call) => call[0] === "navigate")?.[1] as
    | ((item: BoxFolder) => void)
    | undefined;

beforeEach(() => {
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  delete (window as unknown as { Box?: unknown }).Box;
  localStorage.removeItem("box_dev_token");
  configureBoxDevToken({ enabled: false });
  jest.restoreAllMocks();
});

describe("useBoxExplorer: 表示", () => {
  it("ログイン済みでトークンがあれば、ルートとトークンを渡して show() する", () => {
    const instances = installExplorer();
    setupHook({ user: loggedIn("test-token") });

    expect(instances[0].show).toHaveBeenCalledTimes(1);
    expect(instances[0].show).toHaveBeenCalledWith(
      ROOT,
      "test-token",
      expect.objectContaining({ container: ".box-container" }),
    );
  });

  it("変更・プレビュー・ダウンロード・共有リンクの操作は、すべて無効にして表示する", () => {
    const instances = installExplorer();
    setupHook({ user: loggedIn() });

    expect(instances[0].show.mock.calls[0][2]).toMatchObject({
      canPreview: false,
      canDownload: false,
      canShare: false,
      canSetShareAccess: false,
      canUpload: false,
      canDelete: false,
      canRename: false,
      canCreateNewFolder: false,
    });
  });

  it("未ログインなら、show() しない（localStorage にトークンがあっても）", () => {
    localStorage.setItem("box_dev_token", "dev-123");
    const instances = installExplorer();

    const { result } = setupHook();

    expect(instances[0].show).not.toHaveBeenCalled();
    expect(result.current.hasBoxToken).toBe(false);
  });

  it("トークンがあるときは hasBoxToken が true（描画先を出してよい）", () => {
    installExplorer();
    const { result } = setupHook({ user: loggedIn() });
    expect(result.current.hasBoxToken).toBe(true);
  });

  it("window.Box がなければ、何も起きない（開発用トークンもなければ警告も出さない）", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = setupHook({ user: loggedIn() });

    expect(result.current.currentFolder.id).toBe(ROOT);
    expect(warn).not.toHaveBeenCalled();
  });

  it("画面を描画し直しても、show() し直さない（フォルダを移動しても同じ）", () => {
    const instances = installExplorer();
    const { result, rerender } = setupHook({ user: loggedIn() });
    act(() => navigateListener(instances[0])?.(folder("A")));
    rerender();

    expect(result.current.currentFolder.id).toBe("A");
    expect(instances[0].show).toHaveBeenCalledTimes(1);
  });
});

describe("useBoxExplorer: 開発用トークン（ローカル開発）", () => {
  it("有効で開発用トークンがあれば、未ログインでも、そのトークンで show() する", () => {
    configureBoxDevToken({ enabled: true });
    localStorage.setItem("box_dev_token", "dev-123");
    const instances = installExplorer();

    const { result } = setupHook();

    expect(instances[0].show).toHaveBeenCalledWith(ROOT, "dev-123", expect.any(Object));
    expect(result.current.hasBoxToken).toBe(true);
  });

  it("Redux にトークンがあっても、開発用トークンを優先する", () => {
    configureBoxDevToken({ enabled: true });
    localStorage.setItem("box_dev_token", "dev-123");
    const instances = installExplorer();

    setupHook({ user: loggedIn("test-token") });

    expect(instances[0].show.mock.calls[0][1]).toBe("dev-123");
  });

  it("トークンの中身は出さず、長さだけを診断として出す", () => {
    configureBoxDevToken({ enabled: true });
    localStorage.setItem("box_dev_token", "dev-123");
    installExplorer();

    setupHook();

    const logged = (console.info as unknown as jest.Mock).mock.calls
      .map((call) => String(call[0]))
      .join("\n");
    expect(logged).toContain("長さ 7");
    expect(logged).not.toContain("dev-123");
  });

  it("window.Box がないとき、開発用トークンがあれば、警告を出す", () => {
    configureBoxDevToken({ enabled: true });
    localStorage.setItem("box_dev_token", "dev-123");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    setupHook();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("window.Box.ContentExplorer がありません"),
    );
  });
});

describe("useBoxExplorer: 復元先", () => {
  it("通常の表示では、currentFolderId を渡さない（ルートから表示）", () => {
    const instances = installExplorer();
    setupHook({ user: loggedIn() });

    expect(instances[0].show.mock.calls[0][2]).not.toHaveProperty("currentFolderId");
  });

  it("離脱時のフォルダがあるときは、ルートを経由せず、currentFolderId で直接表示する", () => {
    const instances = installExplorer();
    setupHook({ user: loggedIn(), restoreTargetId: "child-saved" });

    // 第 1 引数（rootFolderId）はルートのまま。パンくずの起点になる。
    expect(instances[0].show).toHaveBeenCalledWith(
      ROOT,
      "test-token",
      expect.objectContaining({ currentFolderId: "child-saved" }),
    );
  });
});

describe("useBoxExplorer: フォルダ移動の状態との連携", () => {
  it("navigate イベントの購読を、登録前に整理してから行う", () => {
    const instances = installExplorer();
    setupHook({ user: loggedIn() });

    expect(instances[0].removeAllListeners).toHaveBeenCalled();
    expect(instances[0].addListener).toHaveBeenCalledWith("navigate", expect.any(Function));
  });

  it("navigate イベントが届くと、現在のフォルダと、戻るの可否が更新される", () => {
    const instances = installExplorer();
    const { result } = setupHook({ user: loggedIn() });
    expect(result.current.canGoBack).toBe(false);

    act(() => navigateListener(instances[0])?.(folder("A")));

    expect(result.current.currentFolder.id).toBe("A");
    expect(result.current.canGoBack).toBe(true);
  });

  it("「戻る」を押すと、生成した SDK のインスタンスに navigateTo を指示する", () => {
    const instances = installExplorer();
    const { result } = setupHook({ user: loggedIn() });
    act(() => navigateListener(instances[0])?.(folder("A")));

    act(() => result.current.handleGoBack());

    expect(instances[0].navigateTo).toHaveBeenCalledWith(ROOT);
  });

  it("復元中は、ルートの表示が届いたら、前回のフォルダへ移るよう SDK に指示する", () => {
    const instances = installExplorer();
    const { result } = setupHook({ user: loggedIn(), restoreTargetId: "child-saved" });
    expect(result.current.isRestoring).toBe(true);

    act(() => navigateListener(instances[0])?.(folder(ROOT)));
    expect(instances[0].navigateTo).toHaveBeenCalledWith("child-saved");

    act(() => navigateListener(instances[0])?.(folder("child-saved")));
    expect(result.current.isRestoring).toBe(false);
  });
});

describe("useBoxExplorer: 破棄", () => {
  it("画面を離れるとき（unmount）に、hide() で Explorer を破棄する", () => {
    const instances = installExplorer();
    const { unmount } = setupHook({ user: loggedIn() });
    expect(instances[0].hide).not.toHaveBeenCalled();

    unmount();

    expect(instances[0].hide).toHaveBeenCalledTimes(1);
  });

  it("show() していない（未ログイン等）ときは、unmount しても hide() を呼ばない", () => {
    const instances = installExplorer();
    const { unmount } = setupHook();

    unmount();

    expect(instances[0].show).not.toHaveBeenCalled();
    expect(instances[0].hide).not.toHaveBeenCalled();
  });

  it("hide() が例外を投げても、unmount は失敗しない", () => {
    const instances = installExplorer(() => {
      throw new Error("hide fail");
    });
    const { unmount } = setupHook({ user: loggedIn() });

    expect(() => unmount()).not.toThrow();
    expect(instances[0].hide).toHaveBeenCalledTimes(1);
  });

  it("unmount で、navigate の購読も解除する", () => {
    const instances = installExplorer();
    const { unmount } = setupHook({ user: loggedIn() });
    const before = instances[0].removeAllListeners.mock.calls.length;

    unmount();

    expect(instances[0].removeAllListeners.mock.calls.length).toBeGreaterThan(before);
  });
});
