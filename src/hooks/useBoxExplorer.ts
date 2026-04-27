import { useCallback, useRef, useState } from "react";

import type { BoxFolder } from "@/types/BoxUiElements";
import type { ContentExplorerInstance, FolderInfo } from "@/types/ss";
import { ssActions } from "@/redux/slices/ssSlice";
import { useAppDispatch } from "@/redux/hooks";

type UseBoxExplorerOptions = {
  rootFolderId: string;
  initialFolder: FolderInfo;
  savedHistory: string[];
  savedIndex: number;
  /** ルート以外の深いフォルダから復帰するときに復元先フォルダID。なければ通常起動。 */
  restoreTargetId?: string;
};

type UseBoxExplorerResult = {
  /** Box SDK の ContentExplorer インスタンスを差し込む ref（コンポーネント側で初期化したものをセットする） */
  explorerRef: React.MutableRefObject<ContentExplorerInstance | undefined>;
  currentFolder: FolderInfo;
  folderHistory: string[];
  historyIndex: number;
  /** 深いフォルダへの復元処理が進行中かどうか */
  isRestoring: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  /** Box SDK の navigate イベントを受け取って状態を更新するハンドラ */
  handleNavigate: (item: BoxFolder) => void;
  handleGoBack: () => void;
  handleGoForward: () => void;
};

/**
 * Box ContentExplorer のフォルダ移動状態（現在地・履歴・戻る/進む）を管理するフック。
 *
 * Box SDK 自体の初期化・表示・トークン管理は、このフックの責務外。コンポーネント側で
 * SDK インスタンスを生成して `explorerRef.current` にセットし、`handleNavigate` を
 * SDK の navigate イベントに登録する想定。
 */
export const useBoxExplorer = ({
  rootFolderId,
  initialFolder,
  savedHistory,
  savedIndex,
  restoreTargetId,
}: UseBoxExplorerOptions): UseBoxExplorerResult => {
  const dispatch = useAppDispatch();
  const explorerRef = useRef<ContentExplorerInstance | undefined>(undefined);

  // === ref にする理由 ===
  // 状態のうち「最新値を即座に読みたいが、変化のたびに再描画したくない」ものは ref で持つ。
  // state にすると、setState 直後の同期処理（イベントハンドラの中など）から最新値が読めない。

  /** 戻る/進むボタン経由の navigate かどうかを判定するフラグ。SDK の navigate イベント側で履歴更新をスキップするのに使う。 */
  const isNavigatingRef = useRef(false);
  /** 深いフォルダへの復元中かどうか。復元は navigate イベントを複数回経るため即座読みが必要。 */
  const isRestoringRef = useRef(Boolean(restoreTargetId));
  /** 復元先のフォルダID。初期化以後は変わらない。 */
  const restoreTargetIdRef = useRef(restoreTargetId);
  /** 履歴インデックス。handleGoBack/Forward で「いまの位置 ±1」を即座に読むのに使う。 */
  const historyIndexRef = useRef(savedIndex);
  /** 履歴配列本体。state も持つが、handleNavigate 中で同期的に最新値を参照したいので ref も併用。 */
  const folderHistoryRef = useRef(savedHistory);

  // === state にする理由 ===
  // canGoBack / canGoForward の表示や Explorer の表示など、変化したら画面に反映する必要があるものは state。
  const [currentFolder, setCurrentFolder] = useState<FolderInfo>(initialFolder);
  const [folderHistory, setFolderHistory] = useState<string[]>(savedHistory);
  const [historyIndex, setHistoryIndex] = useState(savedIndex);
  const [isRestoring, setIsRestoring] = useState(Boolean(restoreTargetId));

  /**
   * 履歴インデックス・履歴配列を ref / state / Redux すべてに同期更新する。
   * 「ref と state がずれる」事故をこのヘルパーで防ぐ。
   */
  const syncHistory = useCallback(
    (nextIndex: number, nextHistory: string[]) => {
      historyIndexRef.current = nextIndex;
      folderHistoryRef.current = nextHistory;
      setHistoryIndex(nextIndex);
      setFolderHistory(nextHistory);
      dispatch(
        ssActions.setFolderHistory({
          rootFolderId,
          history: nextHistory,
          index: nextIndex,
        }),
      );
    },
    [dispatch, rootFolderId],
  );

  /**
   * SDK の navigate イベントを受けて、状態を更新する中心ロジック。
   *
   * 経路は3パターン：
   * 1. 復元中（深いフォルダへ戻ろうとしている） → navigateTo で誘導するだけで履歴は触らない
   * 2. 戻る/進むボタン経由 → 履歴は handleGoBack/Forward で更新済みなのでスキップ
   * 3. ユーザーがフォルダをクリックした → 履歴に積む or インデックスを動かす
   */
  const handleNavigate = useCallback(
    (item: BoxFolder) => {
      if (!item || item.type !== "folder") return;

      const nextFolder: FolderInfo = {
        id: item.id,
        name: item.name ?? "",
        pathCollection: item.path_collection
          ? {
              entries: item.path_collection.entries.map((entry) => ({
                id: entry.id,
                name: entry.name ?? "",
              })),
            }
          : undefined,
      };

      // パターン1: 復元処理中
      if (isRestoringRef.current) {
        const targetId = restoreTargetIdRef.current;
        // ルートに到達した → 復元先フォルダへジャンプ
        if (targetId && nextFolder.id === rootFolderId) {
          explorerRef.current?.navigateTo?.(targetId);
          return;
        }
        // 復元先に到達 → 復元完了
        if (targetId && nextFolder.id === targetId) {
          isRestoringRef.current = false;
          setIsRestoring(false);
          setCurrentFolder(nextFolder);
          dispatch(
            ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }),
          );
          return;
        }
      }

      // 同じフォルダの再通知は無視（SDK が冗長に発火するケースの保険）
      if (folderHistoryRef.current[historyIndexRef.current] === nextFolder.id) {
        return;
      }

      setCurrentFolder(nextFolder);
      dispatch(
        ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }),
      );

      // パターン2: 戻る/進むボタン経由
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      // パターン3: ユーザー操作（クリック・パンくず）による移動
      const currentHistory = folderHistoryRef.current;
      const currentIndex = historyIndexRef.current;

      // すでに履歴の手前にあるフォルダ（パンくずでルートを押した等）
      // → ブラウザとは異なるが、ファイルエクスプローラーのパンくず UX として妥当な挙動とする
      const backwardIndex = currentHistory.lastIndexOf(
        nextFolder.id,
        currentIndex,
      );
      if (backwardIndex >= 0) {
        syncHistory(backwardIndex, currentHistory);
        return;
      }

      // すでに履歴の先にあるフォルダ → そこへ進める
      const forwardIndex = currentHistory.indexOf(
        nextFolder.id,
        currentIndex + 1,
      );
      if (forwardIndex >= 0) {
        syncHistory(forwardIndex, currentHistory);
        return;
      }

      // 履歴になければ、現在位置以降を切り捨てて新規エントリを追加
      const trimmed = currentHistory.slice(0, currentIndex + 1);
      const nextHistory = [...trimmed, nextFolder.id];
      syncHistory(trimmed.length, nextHistory);
    },
    [dispatch, rootFolderId, syncHistory],
  );

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < folderHistory.length - 1;

  /**
   * 戻る：履歴を1つ前に動かして、Box SDK にも対象フォルダへ navigate を指示する。
   * historyIndexRef / folderHistoryRef から最新値を読むことで stale closure を回避する。
   */
  const handleGoBack = useCallback(() => {
    if (!canGoBack) return;
    const nextIndex = historyIndexRef.current - 1;
    const folderId = folderHistoryRef.current[nextIndex];
    if (!folderId) return;
    isNavigatingRef.current = true;
    syncHistory(nextIndex, folderHistoryRef.current);
    explorerRef.current?.navigateTo?.(folderId);
  }, [canGoBack, syncHistory]);

  /** 進む：handleGoBack の鏡像。 */
  const handleGoForward = useCallback(() => {
    if (!canGoForward) return;
    const nextIndex = historyIndexRef.current + 1;
    const folderId = folderHistoryRef.current[nextIndex];
    if (!folderId) return;
    isNavigatingRef.current = true;
    syncHistory(nextIndex, folderHistoryRef.current);
    explorerRef.current?.navigateTo?.(folderId);
  }, [canGoForward, syncHistory]);

  return {
    explorerRef,
    currentFolder,
    folderHistory,
    historyIndex,
    isRestoring,
    canGoBack,
    canGoForward,
    handleNavigate,
    handleGoBack,
    handleGoForward,
  };
};
