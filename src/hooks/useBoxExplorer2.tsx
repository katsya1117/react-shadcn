import { useCallback, useRef, useState } from "react";
import type { BoxFolder } from "@/types/BoxUiElements";
import type { FolderInfo, ContentExplorerInstance } from "@/types/ss";
import { ssActions } from "@/redux/slices/ssSlice";
import type { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";

export const useBoxExplorer = (
  rootFolderId: string,
  initialFolder: FolderInfo,
  savedHistory: string[],
  savedIndex: number,
  restoreTargetId?: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  const explorerRef = useRef<ContentExplorerInstance | undefined>(undefined);

  // 制御用Ref（リロードせずに状態を持ちたいもの、常に最新値を求めるもの）
  // isNavigatingRef：戻る／進むボタンを押したかどうかのフラグ
  // 戻る／進むボタンではヒストリを記録不要のため、ボタン経由での navigate イベントは true として記録処理をスキップする目的
  // state だとフラグが間に合わず意図しない挙動になるため Ref
  const isNavigatingRef = useRef(false);

  // isRestoringRef: SSページ以外から復帰する際の復帰動作中かのフラグ
  // 復元は navigate イベントを複数回経て、state だとフラグが間に合わず意図しない挙動になるため Ref
  const isRestoringRef = useRef(Boolean(restoreTargetId));

  // restoreTargetIdRef: Redux の state に記憶していたフォルダ ID
  const restoreTargetIdRef = useRef(restoreTargetId);

  // historyIndexRef：ヒストリ配列（戻る／進む）のうち何番目か
  const historyIndexRef = useRef(savedIndex);

  // 履歴計算のため最新のヒストリを ref で管理
  const folderHistoryRef = useRef(savedHistory);

  const [currentFolder, setCurrentFolder] = useState<FolderInfo>(initialFolder);

  // canGoBack / canGoForward の表示に使っており変化したら画面を再描画する必要があるため state も用意
  const [folderHistory, setFolderHistory] = useState<string[]>(savedHistory);
  const [historyIndex, setHistoryIndex] = useState(savedIndex);
  const [isRestoring, setIsRestoring] = useState(Boolean(restoreTargetId));

  // 履歴インデックスの同期更新
  const syncHistory = useCallback(
    (nextIndex: number, nextHistory: string[]) => {
      // Refを更新（計算で即座に参照するため）
      historyIndexRef.current = nextIndex;
      folderHistoryRef.current = nextHistory;

      // stateを更新（再描画のため）
      setHistoryIndex(nextIndex);
      setFolderHistory(nextHistory);

      // Reduxを更新
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

  const handleNavigate = useCallback(
    (item: BoxFolder) => {
      if (!item || item.type !== "folder") return;

      const nextFolder: FolderInfo = {
        id: item.id,
        name: item.name,
        pathCollection: item.path_collection
          ? {
              entries: item.path_collection.entries.map((e) => ({
                id: e.id,
                name: e.name,
              })),
            }
          : undefined,
      };

      // 読み込み直後、復元すべきフォルダがある場合
      if (isRestoringRef.current) {
        const targetId = restoreTargetIdRef.current;

        // rootFolderId への navigate イベントだったら targetId への navigate で上書き
        if (targetId && nextFolder.id === rootFolderId) {
          explorerRef.current?.navigateTo?.(targetId);
          // rootFolderId の遷移の情報は記録しなくていいので return
          return;
        }

        // targetId への navigate が完了したら isRestoringRef を終了
        if (targetId && nextFolder.id === targetId) {
          isRestoringRef.current = false;
          setIsRestoring(false);
          setCurrentFolder(nextFolder);
          dispatch(
            ssActions.setCurrentFolder({
              rootFolderId,
              folder: nextFolder,
            }),
          );
          return;
          // 復元の遷移の情報は記録しなくていいので return
        }
      }

      // 現在のフォルダと同じ ID なら何もしない
      if (folderHistoryRef.current[historyIndexRef.current] === nextFolder.id) {
        return;
      }

      // 状態更新
      setCurrentFolder(nextFolder);
      dispatch(
        ssActions.setCurrentFolder({
          rootFolderId,
          folder: nextFolder,
        }),
      );

      // 戻る / 進むボタンによる navigate イベントなら、履歴更新をスキップ
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      const currentHistory = folderHistoryRef.current;
      const currentIndex = historyIndexRef.current;

      // 現在のインデックスから過去に向かって、nextFolder があるか（パンくず移動など）
      const backwardIndex = currentHistory.lastIndexOf(
        nextFolder.id,
        currentIndex,
      );
      if (backwardIndex >= 0) {
        syncHistory(backwardIndex, currentHistory);
        return;
      }

      // 現在のインデックスから未来に向かって、nextFolder があるか
      const forwardIndex = currentHistory.indexOf(
        nextFolder.id,
        currentIndex + 1,
      );
      if (forwardIndex >= 0) {
        syncHistory(forwardIndex, currentHistory);
        return;
      }

      // 履歴にないフォルダに移動した場合：現在位置より先の履歴を切り捨てて新規エントリを追加
      const trimmed = currentHistory.slice(0, currentIndex + 1);
      const nextHistory = [...trimmed, nextFolder.id];
      syncHistory(trimmed.length, nextHistory);
    },
    [dispatch, rootFolderId, syncHistory],
  );

  /**
   * 戻る／進むのマニュアル遷移操作
   */
  const executeNavigate = useCallback(
    (folderId: string, nextIndex: number) => {
      isNavigatingRef.current = true;
      syncHistory(nextIndex, folderHistoryRef.current);
      explorerRef.current?.navigateTo?.(folderId);
    },
    [syncHistory],
  );

  return {
    explorerRef,
    currentFolder,
    folderHistory,
    historyIndex,
    isRestoring,
    handleNavigate,
    executeNavigate,
  };
};
