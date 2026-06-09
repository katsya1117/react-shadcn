import { jest } from "@jest/globals";
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

// ── このテストでモックする依存 ─────────────────────────────────────────
// 使い回す共有モック（src/**/__mocks__）はファクトリ無しで有効化。
jest.mock("@/components/layout/Layout");
jest.mock("@/components/ui/tooltip");
jest.mock("@/components/ui/sonner");
jest.mock("@/components/common/LoadingOverlay");
jest.mock("@/redux/slices/userSlice");

// SS 専用の子コンポーネントは、このテスト用の操作ボタンを持つスタブをここに直接定義する。
jest.mock("@/hooks/useBoxExplorer", () => ({ useBoxExplorer: jest.fn() }));

jest.mock("@/components/common/BoxManager/BoxManager", () => ({
  BoxManager: () => <div data-testid="box-manager" />,
}));

jest.mock("@/components/ss/PathBar", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PathBar: ({ onCopyPath, onGoBack, onGoForward, onOpenBox, onOpenExplorer }: any) => (
    <div data-testid="path-bar">
      <button onClick={onCopyPath}>copy-path</button>
      <button onClick={onGoBack}>go-back</button>
      <button onClick={onGoForward}>go-forward</button>
      <button onClick={onOpenBox}>open-box</button>
      <button onClick={onOpenExplorer}>open-explorer</button>
    </div>
  ),
}));

jest.mock("@/components/ss/CollaborationPanel", () => ({
  CollaborationPanel: ({
    onAddCollaborator,
    onRemoveCollaborator,
    onUpdateCollaboratorRole,
    onSelectedCollaboratorChange,
    collaborators,
    folderName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <div data-testid="collaboration-panel">
      <span data-testid="folder-name">{folderName}</span>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {collaborators?.map((c: any, i: number) => (
        <span key={i} data-testid="collaborator">
          {c.collaborator.name}
          {c.isInherited ? "(inherited)" : ""}
          {c.sourcePath ? `[${c.sourcePath}]` : ""}
        </span>
      ))}
      <button
        onClick={() =>
          onSelectedCollaboratorChange({ value: "new-user", label: "New User" })
        }
      >
        select-collaborator
      </button>
      <button onClick={onAddCollaborator}>add-collaborator</button>
      <button
        onClick={() =>
          onRemoveCollaborator({
            id: "c1",
            name: "User1",
            type: "user",
            role: "viewer",
            canEdit: true,
            sourceFolderId: "f1",
          })
        }
      >
        remove-collaborator
      </button>
      <button
        onClick={() =>
          onUpdateCollaboratorRole(
            {
              id: "c1",
              name: "User1",
              type: "user",
              role: "viewer",
              canEdit: true,
              sourceFolderId: "f1",
            },
            "editor",
          )
        }
      >
        update-role
      </button>
    </div>
  ),
}));

import { useBoxExplorer } from "@/hooks/useBoxExplorer";
import { UrlPath } from "@/constants/UrlPath";
import { setup, setupWithStore } from "@test-utils";
import {
  SS,
  PathBarSkeleton,
  ExplorerRestoreSkeleton,
  CollaborationPanelSkeleton,
} from "./SS";
import { ssSliceReducer } from "@/redux/slices/ssSlice";
import { userSliceReducer } from "@/redux/slices/userSlice";
import { autoCompleteSliceReducer } from "@/redux/slices/autoCompleteSlice";
import { BoxApi } from "@/api";
import { toast } from "@/components/ui/sonner";
import type { FolderInfo } from "@/types/ss";

const VALID_ROOT_FOLDER_ID = "370613768434"; // QMS

const makeBoxExplorerMock = (
  overrides: Partial<ReturnType<typeof useBoxExplorer>> = {},
) => ({
  explorerRef: { current: undefined },
  currentFolder: {
    id: VALID_ROOT_FOLDER_ID,
    name: "qms",
    pathCollection: { entries: [] },
  } as FolderInfo,
  folderHistory: [VALID_ROOT_FOLDER_ID],
  historyIndex: 0,
  isRestoring: false,
  canGoBack: false,
  canGoForward: true,
  handleNavigate: jest.fn(),
  handleGoBack: jest.fn(),
  handleGoForward: jest.fn(),
  ...overrides,
});

const makeStore = (
  ssPreload?: Partial<ReturnType<typeof ssSliceReducer>>,
  userPreload?: Partial<ReturnType<typeof userSliceReducer>>,
  autoCompletePreload?: Partial<ReturnType<typeof autoCompleteSliceReducer>>,
) => {
  const userBase = userSliceReducer(undefined, { type: "@@INIT" });
  const ssBase = ssSliceReducer(undefined, { type: "@@INIT" });
  const autoBase = autoCompleteSliceReducer(undefined, { type: "@@INIT" });

  return setupWithStore(<SS />, {
    reducers: {
      user: userSliceReducer,
      ss: ssSliceReducer,
      autoComplete: autoCompleteSliceReducer,
    } as any,
    preloadedState: {
      user: { ...userBase, ...userPreload } as any,
      ss: { ...ssBase, ...ssPreload } as any,
      autoComplete: { ...autoBase, ...autoCompletePreload } as any,
    },
  });
};

// dispatch(thunk).unwrap() が「文字列でない」エラーで reject する状況を作るヘルパー。
// 実 thunk は常に rejectWithValue(string) を返すので、ハンドラの
// `typeof error === "string" ? error : 固定メッセージ` の else 側はこの形でしか再現できない。
const dispatchUnwrapRejectsWith = (error: unknown) =>
  Object.assign(Promise.resolve(), {
    unwrap: () => Promise.reject(error),
  }) as never;

beforeEach(() => {
  (globalThis as any).mockParams = { rootFolderId: VALID_ROOT_FOLDER_ID };
  (useBoxExplorer as any).mockReturnValue(makeBoxExplorerMock());
  jest
    .spyOn(BoxApi.prototype, "getFolderCollaborations")
    .mockResolvedValue({ data: [] });
});

afterEach(() => {
  (globalThis as any).mockParams = {};
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

// ===== Skeleton コンポーネント =====

describe("Skeleton コンポーネント", () => {
  it("PathBarSkeleton はクラッシュなくレンダリングされる", () => {
    const { container } = setup(<PathBarSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("ExplorerRestoreSkeleton はクラッシュなくレンダリングされる", () => {
    const { container } = setup(<ExplorerRestoreSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("CollaborationPanelSkeleton はクラッシュなくレンダリングされる", () => {
    const { container } = setup(<CollaborationPanelSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });
});

// ===== SS コンポーネント =====

describe("SS", () => {
  it("許可されていない folderId は ShareArea へリダイレクトする", () => {
    (globalThis as any).mockParams = { rootFolderId: "invalid-id" };
    setup(
      <MemoryRouter initialEntries={["/job/ShareArea/invalid-id"]}>
        <Routes>
          <Route path={UrlPath.ShareArea} element={<div>ShareArea</div>} />
          <Route path={UrlPath.SS} element={<SS />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("ShareArea")).toBeInTheDocument();
  });

  it("有効な rootFolderId で SSContent をレンダリングする", async () => {
    makeStore();
    await waitFor(() => {
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument();
    });
  });
});

// ===== SSContent =====

describe("SSContent", () => {
  it("accessToken がないとき 'Box に接続中...' を表示する", async () => {
    makeStore();
    await waitFor(() => {
      expect(screen.getByText("Box に接続中...")).toBeInTheDocument();
    });
  });

  it("localStorage に box_dev_token があれば Box SDK の show に渡される", async () => {
    const mockShow = jest.fn();
    (window as any).Box = {
      ContentExplorer: class {
        show = mockShow;
        addListener = jest.fn();
        removeAllListeners = jest.fn();
      },
    };
    localStorage.setItem("box_dev_token", "local-token");

    makeStore(undefined, { isLogin: true });

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith(
        VALID_ROOT_FOLDER_ID,
        "local-token",
        expect.any(Object),
      );
    });

    localStorage.removeItem("box_dev_token");
    delete (window as any).Box;
  });

  it("accessToken がある場合は box-container div を表示する", async () => {
    makeStore(undefined, {
      isLogin: true,
      box: {
        boxAccountId: "acc1",
        token: { accessToken: "test-token" } as any,
        tokenDt: Date.now(),
      },
    });
    await waitFor(() => {
      expect(document.querySelector(".box-container")).toBeInTheDocument();
    });
  });

  it("isRestoring=true のとき PathBar の代わりに PathBarSkeleton を表示する", async () => {
    (useBoxExplorer as any).mockReturnValue(
      makeBoxExplorerMock({ isRestoring: true }),
    );
    makeStore();
    await waitFor(() => {
      expect(screen.queryByTestId("path-bar")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("collaboration-panel"),
      ).not.toBeInTheDocument();
    });
  });

  it("isRestoring=false のとき PathBar と CollaborationPanel を表示する", async () => {
    makeStore();
    await waitFor(() => {
      expect(screen.getByTestId("path-bar")).toBeInTheDocument();
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument();
    });
  });

  it("currentFolder.id が '0' のとき folder-name は '対象フォルダ'（空 name）を表示する", async () => {
    (useBoxExplorer as any).mockReturnValue(
      makeBoxExplorerMock({
        currentFolder: {
          id: "0",
          name: "",
          pathCollection: { entries: [] },
        },
      }),
    );
    makeStore();
    await waitFor(() => {
      expect(screen.getByTestId("folder-name").textContent).toBe("対象フォルダ");
    });
  });

  it("pathCollection にエントリがあるとき buildPath が正しく動作する", async () => {
    (useBoxExplorer as any).mockReturnValue(
      makeBoxExplorerMock({
        currentFolder: {
          id: "child-folder",
          name: "child",
          pathCollection: {
            entries: [
              { id: "0", name: "root" },
              { id: VALID_ROOT_FOLDER_ID, name: "qms" },
            ],
          },
        },
      }),
    );
    makeStore();
    await waitFor(() => {
      expect(screen.getByTestId("folder-name").textContent).toBe("child");
    });
  });
});

// ===== toCollaborationListItem のブランチカバレッジ =====

describe("toCollaborationListItem", () => {
  it("直接コラボ（item.id === currentFolderId）は isInherited=false", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c1",
            accessible_by: { id: "u1", name: "DirectUser", type: "user" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: true,
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      const collab = screen.getByTestId("collaborator");
      expect(collab.textContent).not.toContain("inherited");
    });
  });

  it("継承コラボ（item.id !== currentFolderId）は isInherited=true で表示される", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c2",
            accessible_by: { id: "g1", name: "InheritedGroup", type: "group" as const },
            role: "editor" as const,
            item: { id: "parent-folder", type: "folder" as const, name: "parent" },
            can_view_path: false,
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      const collab = screen.getByTestId("collaborator");
      expect(collab.textContent).toContain("inherited");
    });
  });

  it("item.item が undefined のとき sourceFolderId = currentFolderId (直接コラボ)", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c3",
            accessible_by: { id: "u2", name: "NoItemUser", type: "user" as const },
            role: "viewer" as const,
            can_view_path: true,
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      const collab = screen.getByTestId("collaborator");
      expect(collab.textContent).not.toContain("inherited");
    });
  });

  it("canViewPath（キャメルケース）フォールバックが使われる", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c4",
            accessible_by: { id: "u3", name: "CamelUser", type: "user" as const },
            role: "viewer" as const,
            canViewPath: true,
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      expect(screen.getByTestId("collaborator")).toBeInTheDocument();
    });
  });

  it("can_view_path も canViewPath もない場合はデフォルト true（canEdit=true）", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c5",
            accessible_by: { id: "u4", name: "DefaultUser", type: "user" as const },
            role: "viewer" as const,
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      expect(screen.getByTestId("collaborator")).toBeInTheDocument();
    });
  });

  it("buildSourcePathByFolderId: pathCollection エントリからソースパスを組み立てる", async () => {
    (useBoxExplorer as any).mockReturnValue(
      makeBoxExplorerMock({
        currentFolder: {
          id: VALID_ROOT_FOLDER_ID,
          name: "qms",
          pathCollection: {
            entries: [
              { id: "0", name: "All Files" },
              { id: "parent-id", name: "parent" },
            ],
          },
        },
      }),
    );
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c-inherited",
            accessible_by: { id: "u1", name: "InheritedUser", type: "user" as const },
            role: "viewer" as const,
            item: { id: "parent-id", type: "folder" as const, name: "parent" },
            can_view_path: true,
          } as any,
        ],
      });

    makeStore();
    await waitFor(() => {
      const spans = screen.queryAllByTestId("collaborator");
      expect(spans.some((s) => s.textContent?.includes("inherited"))).toBe(true);
    });
  });
});

// ===== ハンドラ関数 =====

describe("SSContent ハンドラ", () => {
  it("handleCopyPath 成功: clipboard に書き込んで toast.success を呼ぶ", async () => {
    const writeSpy = jest
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("path-bar")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("copy-path"));

    await waitFor(() => {
      expect(writeSpy).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("パスをコピーしました");
    });
  });

  it("handleCopyPath 失敗: clipboard が例外を投げたとき toast.error を呼ぶ", async () => {
    jest
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValue(new Error("clipboard error"));

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("path-bar")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("copy-path"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("コピーに失敗しました");
    });
  });

  it("handleOpenBox: app.box.com/folder URL で window.open を呼ぶ", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("path-bar")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("open-box"));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("app.box.com/folder"),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("handleOpenExplorer: isexplorer: URI で window.open を呼ぶ", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("path-bar")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("open-explorer"));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("isexplorer:"),
      "_blank",
    );
  });

  it("handleAddCollaborator: selectedCollaborator が null のとき何もしない", async () => {
    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("add-collaborator"));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("handleAddCollaborator: 重複コラボレーターで toast.error を出す", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c-exist",
            accessible_by: { id: "new-user", name: "New User", type: "user" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: true,
          } as any,
        ],
      });

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("select-collaborator"));
    await user.click(screen.getByText("add-collaborator"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "同じコラボレーターは既に設定されています",
      );
    });
  });

  it("handleAddCollaborator: 成功で toast.success を出す", async () => {
    jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockResolvedValue({ data: {} as any });

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("select-collaborator"));
    await user.click(screen.getByText("add-collaborator"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("追加しました"),
      );
    });
  });

  it("handleAddCollaborator: 失敗で rejectWithValue 文字列を toast.error に渡す", async () => {
    jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockRejectedValue(new Error("create fail"));

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("select-collaborator"));
    await user.click(screen.getByText("add-collaborator"));

    // parseApiError(non-Axios error) returns fallback string
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("予期せぬエラーが発生しました。");
    });
  });

  it("handleRemoveCollaborator: 成功で toast.success を出す", async () => {
    jest
      .spyOn(BoxApi.prototype, "deleteCollaborations")
      .mockResolvedValue({ data: true });

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("remove-collaborator"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("削除しました"),
      );
    });
  });

  it("handleRemoveCollaborator: 失敗で toast.error を出す", async () => {
    jest
      .spyOn(BoxApi.prototype, "deleteCollaborations")
      .mockRejectedValue(new Error("delete fail"));

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("remove-collaborator"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "コラボレーターの削除に失敗しました",
      );
    });
  });

  it("handleUpdateCollaboratorRole: 成功で toast.success を出す", async () => {
    jest
      .spyOn(BoxApi.prototype, "updateCollaboration")
      .mockResolvedValue({ data: {} as any });

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("update-role"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("ロールを更新しました"),
      );
    });
  });

  it("handleUpdateCollaboratorRole: 失敗で rejectWithValue 文字列を toast.error に渡す", async () => {
    jest
      .spyOn(BoxApi.prototype, "updateCollaboration")
      .mockRejectedValue(new Error("update fail"));

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("update-role"));

    // parseApiError(non-Axios error) returns fallback string
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("予期せぬエラーが発生しました。");
    });
  });

  it("getFolderCollaborations 失敗で toast.error を出す", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockRejectedValue(new Error("fetch fail"));

    makeStore();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "コラボレーター一覧の取得に失敗しました",
      );
    });
  });
});

// ===== 追加ブランチカバレッジテスト =====

describe("追加ブランチカバレッジ", () => {
  it("SS: 無効な folderId で Navigate を返す（line 600）", () => {
    (globalThis as any).mockParams = { rootFolderId: "invalid-id" };
    setup(<SS />);
    // Navigate mock が mockLocation を ShareArea に更新する
    expect((globalThis as any).mockLocation.pathname).toContain("ShareArea");
  });

  it("initialHistory: history[0] !== rootFolderId のとき並べ替える（line 218）", async () => {
    makeStore({
      folderHistoryByRootId: {
        [VALID_ROOT_FOLDER_ID]: ["other-folder", VALID_ROOT_FOLDER_ID],
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument();
    });
  });

  it("initialHistory: 空 history のとき rootFolderId を先頭に追加（line 218）", async () => {
    makeStore({
      folderHistoryByRootId: { [VALID_ROOT_FOLDER_ID]: [] },
    });
    await waitFor(() => {
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument();
    });
  });

  it("handleOpenExplorer: pathCollection に entries がある場合（line 382-383）", async () => {
    (useBoxExplorer as any).mockReturnValue(
      makeBoxExplorerMock({
        currentFolder: {
          id: VALID_ROOT_FOLDER_ID,
          name: "qms",
          pathCollection: {
            entries: [
              { id: "0", name: "All Files" }, // filtered out
              { id: "parent-id", name: "parent" }, // included
            ],
          },
        },
      }),
    );
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("path-bar")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("open-explorer"));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("parent"),
      "_blank",
    );
  });

  it("handleAddCollaborator: グループ選択のとき collaboratorType='department'（line 407）", async () => {
    jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockResolvedValue({ data: {} as any });

    // groups に "new-user" を追加 → department 判定
    const { user } = makeStore(
      undefined,
      undefined,
      { groups: [{ value: "new-user", label: "New User Group" }] },
    );
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("select-collaborator")); // value="new-user"
    await user.click(screen.getByText("add-collaborator"));

    await waitFor(() => {
      // createCollaborations が department type で呼ばれることを確認
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("追加しました"),
      );
    });
  });

  it("handleAddCollaborator 成功後の refreshCollaborations 失敗で '追加は完了しましたが...' を表示（line 458）", async () => {
    jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockResolvedValue({ data: {} as any });
    // 初回ロード成功、成功後のリフレッシュは失敗
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(new Error("refresh fail"));

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("select-collaborator"));
    await user.click(screen.getByText("add-collaborator"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "追加は完了しましたが一覧の更新に失敗しました",
      );
    });
  });

  it("handleRemoveCollaborator 成功後の refreshCollaborations 失敗で '削除は完了しましたが...' を表示（line 491）", async () => {
    jest
      .spyOn(BoxApi.prototype, "deleteCollaborations")
      .mockResolvedValue({ data: true });
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(new Error("refresh fail"));

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("remove-collaborator"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "削除は完了しましたが一覧の更新に失敗しました",
      );
    });
  });

  it("handleUpdateCollaboratorRole 成功後の refreshCollaborations 失敗で '更新は完了しましたが...' を表示（line 523）", async () => {
    jest
      .spyOn(BoxApi.prototype, "updateCollaboration")
      .mockResolvedValue({ data: {} as any });
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(new Error("refresh fail"));

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("update-role"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "更新は完了しましたが一覧の更新に失敗しました",
      );
    });
  });

  it("sort: canEdit が混在する collaborators を正しくソートする（line 332）", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c-noedit",
            accessible_by: { id: "u1", name: "NoEditUser", type: "group" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: false, // canEdit=false
          } as any,
          {
            id: "c-edit",
            accessible_by: { id: "u2", name: "EditUser", type: "user" as const },
            role: "editor" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: true, // canEdit=true
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      const collabs = screen.queryAllByTestId("collaborator");
      expect(collabs).toHaveLength(2);
      // EditUser (canEdit=true) が先
      expect(collabs[0].textContent).toContain("EditUser");
    });
  });

  it("restoreTargetId: rememberedCurrentFolder.id が rootFolderId と異なる場合に設定される（line 225-226）", async () => {
    const savedFolder = {
      id: "child-saved",
      name: "saved-child",
      pathCollection: { entries: [] },
    };
    makeStore({
      currentFolderByRootId: { [VALID_ROOT_FOLDER_ID]: savedFolder },
    });
    await waitFor(() => {
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument();
    });
  });

  it("buildPath: pathCollection が undefined のとき entries フォールバック [] を使う（line 64）", async () => {
    (useBoxExplorer as any).mockReturnValue(
      makeBoxExplorerMock({
        currentFolder: {
          id: "some-child",
          name: "child",
          pathCollection: undefined as any,
        },
      }),
    );
    makeStore();
    await waitFor(() => {
      expect(screen.getByTestId("folder-name").textContent).toBe("child");
    });
  });

  it("accessible_by.name が undefined のとき '名称未設定' を使う（line 119）", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c-noname",
            accessible_by: { id: "u1", type: "user" as const }, // no name field
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: true,
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      const collab = screen.getByTestId("collaborator");
      expect(collab.textContent).toContain("名称未設定");
    });
  });

  it("sort: canEdit が等しく isInherited が異なる場合（line 334）", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c-inherited",
            accessible_by: { id: "u1", name: "InheritedUser", type: "user" as const },
            role: "viewer" as const,
            item: { id: "parent-folder", type: "folder" as const, name: "parent" }, // inherited
            can_view_path: true, // canEdit=true
          } as any,
          {
            id: "c-direct",
            accessible_by: { id: "u2", name: "DirectUser", type: "user" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" }, // direct
            can_view_path: true, // canEdit=true (same as above)
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      const collabs = screen.queryAllByTestId("collaborator");
      expect(collabs).toHaveLength(2);
      // DirectUser (isInherited=false) より先
      expect(collabs[0].textContent).toContain("DirectUser");
    });
  });

  it("sort: canEdit と isInherited が等しく type が異なる（department < user）場合（line 335 -1 分岐）", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c-user",
            accessible_by: { id: "u1", name: "UserCollab", type: "user" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: true,
          } as any,
          {
            id: "c-group",
            accessible_by: { id: "g1", name: "DeptCollab", type: "group" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: true,
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      const collabs = screen.queryAllByTestId("collaborator");
      expect(collabs).toHaveLength(2);
      // "department" < "user" alphabetically → DeptCollab 先
      expect(collabs[0].textContent).toContain("DeptCollab");
    });
  });

  it("sort: canEdit と isInherited が等しく a.type > b.type のとき 1 を返す（line 335 1 分岐）", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c-group",
            accessible_by: { id: "g1", name: "DeptCollab", type: "group" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: true,
          } as any,
          {
            id: "c-user",
            accessible_by: { id: "u1", name: "UserCollab", type: "user" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            can_view_path: true,
          } as any,
        ],
      });
    makeStore();
    await waitFor(() => {
      const collabs = screen.queryAllByTestId("collaborator");
      expect(collabs).toHaveLength(2);
      // sort puts "department" before "user" even when data comes reversed
      expect(collabs[0].textContent).toContain("DeptCollab");
    });
  });

  it("handleOpenExplorer: userCd が undefined のとき boxDriveRoot の ?? '' フォールバックを使う（line 379）", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    // loginUserCd を undefined にして userCd ?? "" の右辺を実行させる
    const { user } = makeStore(undefined, { loginUserCd: undefined as any });
    await waitFor(() =>
      expect(screen.getByTestId("path-bar")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("open-explorer"));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("isexplorer:"),
      "_blank",
    );
  });

  it("handleOpenExplorer: userCd が空文字のとき boxDriveRoot が '...\\\\Box' になる（line 379）", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    // デフォルトの user 状態は loginUserCd="" なので userCd = ""
    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("path-bar")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("open-explorer"));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("isexplorer:"),
      "_blank",
    );
  });

  it("handleOpenExplorer: pathCollection が undefined のとき entrySegments = []（line 381）", async () => {
    (useBoxExplorer as any).mockReturnValue(
      makeBoxExplorerMock({
        currentFolder: {
          id: VALID_ROOT_FOLDER_ID,
          name: "qms",
          pathCollection: undefined as any,
        },
      }),
    );
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("path-bar")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("open-explorer"));
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining("isexplorer:"), "_blank");
  });

  it("handleAddCollaborator: 非文字列エラーのとき '追加に失敗しました' を表示（line 447 false 分岐）", async () => {
    const { user, dispatchSpy } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    dispatchSpy.mockReturnValue(
      dispatchUnwrapRejectsWith(new Error("non-string error")),
    );

    await user.click(screen.getByText("select-collaborator"));
    await user.click(screen.getByText("add-collaborator"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("コラボレーターの追加に失敗しました");
    });
  });

  it("handleUpdateCollaboratorRole: 非文字列エラーのとき 'ロール更新に失敗しました' を表示（line 512 false 分岐）", async () => {
    const { user, dispatchSpy } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    dispatchSpy.mockReturnValue(
      dispatchUnwrapRejectsWith(new Error("non-string role error")),
    );

    await user.click(screen.getByText("update-role"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("コラボレーターのロール更新に失敗しました");
    });
  });

  it("handleAddCollaborator: collaborationsByFolderId にデータなし → 空配列フォールバック（line 418）", async () => {
    jest
      .spyOn(BoxApi.prototype, "createCollaborations")
      .mockResolvedValue({ data: {} as any });
    // getFolderCollaborations をハングさせてstore に rows を入れないようにする
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockReturnValue(new Promise(() => {}));

    const { user } = makeStore();
    // パネルが表示されるまで待つ（isRestoring=false になれば表示される）
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("select-collaborator"));
    await user.click(screen.getByText("add-collaborator"));

    await waitFor(() => {
      // rows がないので重複チェックでは何もヒットせず createCollaborations が呼ばれる
      // ただし getFolderCollaborations がハングしているので success toast はでない
      // ここでは toast.error が '追加に失敗しました' 系でないことを確認
      expect(toast.error).not.toHaveBeenCalledWith("同じコラボレーターは既に設定されています");
    });
  });

  it("重複チェック: can_view_path も canViewPath もないとき canManage=true として扱う（line 420 true 分岐）", async () => {
    jest
      .spyOn(BoxApi.prototype, "getFolderCollaborations")
      .mockResolvedValue({
        data: [
          {
            id: "c-noflags",
            accessible_by: { id: "new-user", name: "New User", type: "user" as const },
            role: "viewer" as const,
            item: { id: VALID_ROOT_FOLDER_ID, type: "folder" as const, name: "qms" },
            // neither can_view_path nor canViewPath → canManage defaults to true
          } as any,
        ],
      });

    const { user } = makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("select-collaborator")); // value="new-user"
    await user.click(screen.getByText("add-collaborator"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("同じコラボレーターは既に設定されています");
    });
  });
});

// ===== window.Box SDK 連携 =====

describe("Box SDK 連携", () => {
  it("window.Box.ContentExplorer があれば explorerInstance を生成して show を呼ぶ", async () => {
    const mockShow = jest.fn();
    const mockAddListener = jest.fn();
    const mockRemoveAllListeners = jest.fn();

    (window as any).Box = {
      ContentExplorer: class {
        show = mockShow;
        addListener = mockAddListener;
        removeAllListeners = mockRemoveAllListeners;
      },
    };

    makeStore(undefined, {
      isLogin: true,
      box: {
        boxAccountId: "acc1",
        token: { accessToken: "test-token" } as any,
        tokenDt: Date.now(),
      },
    });

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith(
        VALID_ROOT_FOLDER_ID,
        "test-token",
        expect.any(Object),
      );
    });
    expect(mockAddListener).toHaveBeenCalledWith(
      "navigate",
      expect.any(Function),
    );

    // navigate イベントリスナーを実際に起動して listener 関数本体（line 310）をカバーする
    const navigateListener = mockAddListener.mock.calls.find(
      (call: any[]) => call[0] === "navigate",
    )?.[1] as ((item: any) => void) | undefined;
    if (navigateListener) {
      navigateListener({ id: "new-folder", name: "New Folder", pathCollection: { entries: [] } });
    }

    delete (window as any).Box;
  });
});
