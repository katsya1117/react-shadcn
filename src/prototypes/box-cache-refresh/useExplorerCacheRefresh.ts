import { useCallback, useMemo } from "react";

import { toast } from "@/components/ui/sonner";

import { boxFolderCache, isBoxFolderCacheEnabled } from "./boxFolderCache";

type RefreshOptions = {
  /** useBoxExplorerWithRefresh の handleRefresh（現在のフォルダを取り直す） */
  handleRefresh: () => void;
  /** コラボレーター一覧のキャッシュを破棄し、一覧が開いていれば取り直す（SS.tsx の refreshCollaborations） */
  refreshCollaborations: () => Promise<void>;
};

/**
 * 【試作・未使用】Explorer の show() の options に展開する、フォルダ取得のキャッシュの中継処理。
 * キャッシュが有効（VITE_BOX_FOLDER_CACHE=true）のときだけ、requestInterceptor / responseInterceptor を含む。無効なら空。
 * 参照は変わらない（show の依存配列に入れても、再実行されない）。
 */
export const useBoxFolderCacheOptions = () =>
  useMemo(
    () =>
      isBoxFolderCacheEnabled()
        ? {
            requestInterceptor: boxFolderCache.requestInterceptor,
            responseInterceptor: boxFolderCache.responseInterceptor,
          }
        : {},
    [],
  );

/**
 * 【試作・未使用】更新ボタンの処理。今見ている画面の情報を、まとめて最新にする。
 *   1. フォルダ取得のキャッシュを全て破棄して、現在のフォルダを取り直す（先に破棄する。逆だと保存済みの内容が返る）
 *   2. コラボレーター一覧のキャッシュを全て破棄して、一覧が開いていれば、現在のフォルダの一覧を取り直す
 *      （一覧には親フォルダからの継承分も含まれ、他の管理者が親フォルダを変更すると配下の一覧も古くなるため、
 *       現在のフォルダ以外も破棄する。畳んでいれば、次に開いたときに取得する）
 *
 * useBoxFolderCacheOptions と分けているのは、呼び出し位置の都合。
 * cacheOptions は show() の effect より前、handleRefreshAll は refreshCollaborations より後ろで、呼ぶ必要がある。
 * 組み込み方は README.md を参照。
 */
export const useRefreshAll = ({
  handleRefresh,
  refreshCollaborations,
}: RefreshOptions) =>
  useCallback(async () => {
    boxFolderCache.clear();
    handleRefresh();
    try {
      await refreshCollaborations();
    } catch {
      toast.error("コラボレーター一覧の取得に失敗しました");
    }
  }, [handleRefresh, refreshCollaborations]);
