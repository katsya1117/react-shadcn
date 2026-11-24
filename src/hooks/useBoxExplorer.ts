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

  /**
   * 「戻る/進む」で、いま向かっているフォルダの ID。向かっていなければ undefined。
   * Explorer から届いた知らせが、この ID のフォルダなら、「戻る/進むの結果」と判断する（違えば、利用者の操作として扱う）。
   * 旗（true/false）ではなく ID にしている理由: 戻る/進むが失敗して知らせが来ないとき、旗だと立ったままになり、
   * 次の利用者の操作を、戻る/進むの結果と取り違えて、履歴がずれるため。
   */
  const pendingTargetIdRef = useRef<string | undefined>(undefined);
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
   * Box の Explorer が「このフォルダを表示した」と知らせてきたとき（navigate イベント）に呼ばれる。
   * 画面に出している「現在のフォルダ」と、戻る/進むのための「履歴」を、Explorer の表示に合わせて更新する。
   *
   * 履歴は、「訪れたフォルダ ID の並び」と「いま並びのどこにいるか（位置）」の 2 つで持つ。
   *   例: 履歴 [R, A, B]、位置 2 → いまは B にいる。「戻る」で A へ、さらに「戻る」で R へ。
   *
   * 知らせが来る理由は 4 つあり、理由ごとに、やることが違う。上から順に判定して、当てはまったところで終わる。
   *   ① 復元中       : 他の画面から戻ってきて、前回見ていたフォルダを開き直している途中。履歴は触らない。
   *   ② 戻る/進む    : 戻る/進むボタンを押した結果（向かっていたフォルダの知らせ）。履歴は、ボタンを押した時点で更新済み。
   *                    現在のフォルダだけ更新する。
   *   ③ 同じ知らせ   : いまいるフォルダと同じ知らせ（Explorer が二重に知らせることがある）。何もしない。
   *   ④ 利用者の操作 : フォルダをクリックした、または、パンくずをクリックした。履歴に積む（ブラウザと同じ）。
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

      // ① 復元中: 他の画面から戻ってきて、前回見ていたフォルダを開き直している途中。
      //    Explorer は、先にルートを表示してから、前回のフォルダへ移る。履歴は、保存してあるものをそのまま使うので、触らない。
      if (isRestoringRef.current) {
        const targetId = restoreTargetIdRef.current;
        // ルートが表示された → 前回のフォルダへ移るよう、Explorer に指示する（この知らせは、これで終わり）
        if (targetId && nextFolder.id === rootFolderId) {
          explorerRef.current?.navigateTo?.(targetId);
          return;
        }
        // 前回のフォルダが表示された → 復元は完了。現在のフォルダだけ更新する
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

      // ② 戻る/進むボタンの結果: 履歴の位置は、ボタンを押した時点（handleGoBack / handleGoForward）で、すでに動かしてある。
      //    ここでは、現在のフォルダの表示だけを更新する。
      //    向かっていたフォルダの知らせのときだけ、この扱いにする。違うフォルダの知らせなら、戻る/進むは失敗した
      //    （または、別の操作が先に来た）ので、向かう先は忘れて、利用者の操作（④）として扱う。
      //    ③より先に判定する理由: 位置は先に動かしてあるので、この知らせは「いまいるフォルダと同じ知らせ」に見えてしまい、
      //    ③で捨てられて、現在のフォルダが更新されなくなるため。
      const pendingTargetId = pendingTargetIdRef.current;
      if (pendingTargetId !== undefined) {
        pendingTargetIdRef.current = undefined;
        if (nextFolder.id === pendingTargetId) {
          setCurrentFolder(nextFolder);
          dispatch(
            ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }),
          );
          return;
        }
      }

      // ③ 同じ知らせ: いまいるフォルダ（履歴の現在位置のフォルダ）と同じなら、何もしない（Explorer が二重に知らせる場合の保険）
      if (folderHistoryRef.current[historyIndexRef.current] === nextFolder.id) {
        return;
      }

      // ④ 利用者の操作（フォルダのクリック、パンくずのクリック）: 現在のフォルダを更新し、履歴に積む。
      //    パンくずで、すでに履歴にあるフォルダへ戻った場合も、同じ（位置を動かすだけにはしない）。
      //    ブラウザと同じ動きで、「戻る」で、押す前にいたフォルダへ戻れる。
      //    例: 履歴 [R, A, B, C]、位置 3（C）で、パンくずで A を押す → 履歴は [R, A, B, C, A]、位置 4。「戻る」で C へ戻れる。
      //    位置が履歴の途中にあるときは、位置より先の履歴を捨ててから積む（例: [R, A, B] の位置 1 で X を開く → [R, A, X]）。
      setCurrentFolder(nextFolder);
      dispatch(
        ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }),
      );

      const currentHistory = folderHistoryRef.current;
      const currentIndex = historyIndexRef.current;
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
    // 向かう先を覚える（Explorer に指示できるときだけ。指示できないと、知らせが来ず、覚えたままになるため）
    if (explorerRef.current?.navigateTo) pendingTargetIdRef.current = folderId;
    syncHistory(nextIndex, folderHistoryRef.current);
    explorerRef.current?.navigateTo?.(folderId);
  }, [canGoBack, syncHistory]);

  /** 進む：handleGoBack の鏡像。 */
  const handleGoForward = useCallback(() => {
    if (!canGoForward) return;
    const nextIndex = historyIndexRef.current + 1;
    const folderId = folderHistoryRef.current[nextIndex];
    if (!folderId) return;
    if (explorerRef.current?.navigateTo) pendingTargetIdRef.current = folderId;
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
