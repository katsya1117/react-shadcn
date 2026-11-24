import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

import { toast } from "@/components/ui/sonner";

import { boxFolderCache, configureBoxFolderCache } from "./boxFolderCache";
import {
  useBoxFolderCacheOptions,
  useRefreshAll,
} from "./useExplorerCacheRefresh";

// 【試作】SS.tsx から取り除いた、キャッシュの組み込みと更新ボタンの処理の検証。
// SS.tsx に戻すときの確認用（手順は README.md）。

jest.mock("@/components/ui/sonner");

afterEach(() => {
  configureBoxFolderCache({ enabled: false });
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("useBoxFolderCacheOptions", () => {
  it("キャッシュが有効なとき、requestInterceptor / responseInterceptor を返す", () => {
    configureBoxFolderCache({ enabled: true });
    const { result } = renderHook(() => useBoxFolderCacheOptions());
    expect(result.current).toEqual({
      requestInterceptor: boxFolderCache.requestInterceptor,
      responseInterceptor: boxFolderCache.responseInterceptor,
    });
  });

  it("キャッシュが無効なとき（VITE_BOX_FOLDER_CACHE=false）は、空を返す", () => {
    configureBoxFolderCache({ enabled: false });
    const { result } = renderHook(() => useBoxFolderCacheOptions());
    expect(result.current).toEqual({});
  });
});

describe("useRefreshAll（更新ボタン）", () => {
  it("フォルダ取得のキャッシュを破棄してから、現在のフォルダを取り直す（順序が逆だと保存済みの内容が返る）", async () => {
    const handleRefresh = jest.fn();
    const refreshCollaborations = jest.fn(() => Promise.resolve());
    const clearSpy = jest.spyOn(boxFolderCache, "clear");
    const { result } = renderHook(() =>
      useRefreshAll({ handleRefresh, refreshCollaborations }),
    );

    await act(async () => {
      await result.current();
    });

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(handleRefresh).toHaveBeenCalledTimes(1);
    expect(clearSpy.mock.invocationCallOrder[0]).toBeLessThan(
      handleRefresh.mock.invocationCallOrder[0],
    );
  });

  it("コラボレーター一覧も取り直す", async () => {
    const refreshCollaborations = jest.fn(() => Promise.resolve());
    const { result } = renderHook(() =>
      useRefreshAll({ handleRefresh: jest.fn(), refreshCollaborations }),
    );

    await act(async () => {
      await result.current();
    });

    expect(refreshCollaborations).toHaveBeenCalledTimes(1);
  });

  it("一覧の取り直しに失敗したら、失敗のメッセージを表示する（フォルダの更新は行う）", async () => {
    const handleRefresh = jest.fn();
    const refreshCollaborations = jest.fn(() =>
      Promise.reject(new Error("fetch fail")),
    );
    const { result } = renderHook(() =>
      useRefreshAll({ handleRefresh, refreshCollaborations }),
    );

    await act(async () => {
      await result.current();
    });

    expect(handleRefresh).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      "コラボレーター一覧の取得に失敗しました",
    );
  });
});
