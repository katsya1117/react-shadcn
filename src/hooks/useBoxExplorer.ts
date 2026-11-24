import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { getBoxDevToken } from "@/lib/boxDevToken";
import { boxSelector, userSelector } from "@/redux/slices/userSlice";
import type { BoxFolder } from "@/types/BoxUiElements";
import type { ContentExplorerInstance, FolderInfo } from "@/types/ss";
import { useFolderNavigation } from "./useFolderNavigation";
// [PROTO-CACHE-REFRESH] 1/5: 試作（フォルダ取得キャッシュ・更新ボタン）。未使用。有効にする手順は src/prototypes/box-cache-refresh/README.md
// import { useBoxExplorerWithRefresh } from "@/prototypes/box-cache-refresh/useBoxExplorerWithRefresh";
// import { useBoxFolderCacheOptions } from "@/prototypes/box-cache-refresh/useExplorerCacheRefresh";

type UseBoxExplorerOptions = {
  rootFolderId: string;
  initialFolder: FolderInfo;
  savedHistory: string[];
  savedIndex: number;
  /** ルート以外の深いフォルダから復帰するときの復元先フォルダ ID。なければ通常起動。 */
  restoreTargetId?: string;
};

/**
 * Box の Content Explorer（画面部品）を、画面に出して、フォルダ移動の状態と結びつけるフック。
 *
 * - フォルダ移動の状態（現在地・履歴・戻る/進む・復元）は `useFolderNavigation` が持つ。
 * - このフックは、Box SDK の側を受け持つ: 接続に使うトークンの決定、インスタンスの生成、`show()`、
 *   画面を離れるときの `hide()`、`navigate` イベントの購読（→ `useFolderNavigation` の `handleNavigate`）。
 *
 * 描画先は、呼び出し側が用意する `.box-container` 要素。`hasBoxToken` が true のときに、それを描画する。
 */
export const useBoxExplorer = ({
  rootFolderId,
  initialFolder,
  savedHistory,
  savedIndex,
  restoreTargetId,
}: UseBoxExplorerOptions) => {
  // ----- 接続に使うトークン -----
  const isLogin = useSelector(userSelector.isLoginSelector());
  const token = useSelector(boxSelector.tokenSelector());
  // 開発時のみ、開発用トークンがあれば、ログイン状態やモックのトークンに関係なく、それで接続する。
  const devToken = getBoxDevToken();
  const accessToken =
    devToken ??
    token?.accessToken ??
    localStorage.getItem("box_dev_token") ??
    undefined;
  /** 描画先（`.box-container`）を出してよいか。false の間は、呼び出し側が「接続中」を表示する。 */
  const hasBoxToken = Boolean(token?.accessToken) || Boolean(devToken);

  // ----- フォルダ移動の状態 -----
  const {
    explorerRef,
    currentFolder,
    isRestoring,
    canGoBack,
    canGoForward,
    handleNavigate,
    handleGoBack,
    handleGoForward,
    // [PROTO-CACHE-REFRESH] 2/5: useFolderNavigation を useBoxExplorerWithRefresh に差し替え、handleRefresh を受け取って、下の return に足す
    // handleRefresh,
  } = useFolderNavigation({
    rootFolderId,
    initialFolder,
    savedHistory,
    savedIndex,
    restoreTargetId,
  });
  // [PROTO-CACHE-REFRESH] 4/5（前半）: const cacheOptions = useBoxFolderCacheOptions();

  // 復元先は「マウント時点」の値で固定する。離脱時のフォルダは、移動のたびに Redux 側で更新されるため、
  // そのまま show の依存に使うと、移動のたびに show し直してしまう。
  const initialRestoreTargetIdRef = useRef(restoreTargetId);

  // ----- Box SDK のライフサイクル管理 -----
  const [explorerInstance, setExplorerInstance] = useState<
    ContentExplorerInstance | undefined
  >(undefined);

  // SDK インスタンスを生成して explorerRef にも差し込む（useFolderNavigation はこの ref を介して navigateTo を呼ぶ）
  useEffect(() => {
    /* istanbul ignore next */ if (typeof window === "undefined") return;
    if (explorerInstance) return;
    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) {
      if (devToken) {
        console.warn(
          "[box] window.Box.ContentExplorer がありません。index.html の Box UI Elements の読み込みを確認してください。",
        );
      }
      return;
    }
    const explorer = new BoxGlobal.ContentExplorer();
    setExplorerInstance(explorer);
    explorerRef.current = explorer;
  }, [explorerInstance, explorerRef, devToken]);

  // show() 済みかどうか。hide() は show() 前に呼ぶと例外になるため、unmount 時の判定に使う。
  const hasShownRef = useRef(false);

  // ログイン済み & トークンがあれば Explorer を表示
  useEffect(() => {
    if (!explorerInstance || !accessToken) return;
    if (!isLogin && !devToken) return;
    if (devToken) {
      // 診断用。トークンの中身は出さず、長さだけを出す（Box の開発用トークンは通常 32 文字）。
      console.info(
        `[box] 開発用トークンで接続します（長さ ${devToken.length}）。401 になる場合は、期限切れ（60 分）か、トークンの誤りです。`,
      );
    }
    explorerInstance.show(rootFolderId, accessToken, {
      container: ".box-container",
      // 深いフォルダからの復帰時は、ルートを経由せず最初から離脱時のフォルダを表示する（ルートの取得を省く）。
      // rootFolderId はパンくずの起点として引き続き使われる。currentFolderId は公式ドキュメント未記載だが、
      // Box UI Elements のソース上（v23.0.0・v26.0.0 で確認）、show() の options が ContentExplorer の props にそのまま渡される。
      ...(initialRestoreTargetIdRef.current
        ? { currentFolderId: initialRestoreTargetIdRef.current }
        : {}),
      canPreview: false,
      canDownload: false,
      // 共有リンクの作成（ファイルの行の「…」メニューの「Share」）も出さない。既定では出る（docs/report-box-ui-elements-26-verification.md の 6）。
      canShare: false,
      canSetShareAccess: false,
      // [FILE-COLLAB] 3/4: 行の「…」メニューに独自項目を足す。canDelete 等が全て false でも、この項目があればメニューは出る。
      // type を "file" にするとファイルの行のみ。省略するとフォルダにも出る（子フォルダを開かずに対象にできる）。
      // Box UI Elements の itemActions（v23.0.0・v26.0.0 の両方にある）。show() の options が props にそのまま渡る。
      // jsdom 上で、23・26 とも、「…」メニューに項目が出て、onAction にアイテムが渡ることを確認済み
      // （docs/report-box-ui-elements-26-verification.md）。本物の Box 上での確認は未実施。
      // 有効にするときは、選んだファイルを SS.tsx へ渡す口（例: このフックの引数 onSelectFile）も要る。
      // itemActions: [
      //   {
      //     label: "コラボレーション対象にする",
      //     type: "file",
      //     onAction: (item: { id: string; name: string }) =>
      //       onSelectFile({ id: item.id, name: item.name }),
      //   },
      // ],
      // [PROTO-CACHE-REFRESH] 3/5: フォルダ取得を 5 分間キャッシュする中継処理（キャッシュが有効なときだけ中身が入る）
      // ...cacheOptions,   // 併せて、この effect の依存配列に cacheOptions を足す
      // このアプリの Explorer はコラボレート対象フォルダを選ぶための画面。
      // ファイル・フォルダの変更系操作は画面から行わせない（UI 上のボタン非表示のみで、Box 側の権限は変えない）。
      canUpload: false,
      canDelete: false,
      canRename: false,
      canCreateNewFolder: false,
      size: "large",
    });
    hasShownRef.current = true;
  // [FILE-COLLAB] 4/4: 上の itemActions を有効にしたら、依存配列に onSelectFile を足す（eslint の react-hooks/exhaustive-deps 対応）。
  }, [explorerInstance, rootFolderId, accessToken, isLogin, devToken]);

  // 画面を離れるときに Explorer を破棄する。
  // hide() を呼ばないと、Box 側の React ツリー（API インスタンスとキャッシュ）が unmount されず残り続ける。
  useEffect(() => {
    if (!explorerInstance) return;
    return () => {
      if (!hasShownRef.current) return;
      hasShownRef.current = false;
      try {
        explorerInstance.hide?.();
      } catch {
        // 破棄に失敗しても画面遷移は妨げない
      }
    };
  }, [explorerInstance]);

  // navigate イベントを useFolderNavigation の handleNavigate に流し込む
  useEffect(() => {
    if (!explorerInstance) return;
    const listener = (item: BoxFolder) => handleNavigate(item);
    explorerInstance.removeAllListeners?.();
    explorerInstance.addListener?.("navigate", listener);
    return () => {
      explorerInstance.removeAllListeners?.();
    };
  }, [explorerInstance, handleNavigate]);

  return {
    currentFolder,
    isRestoring,
    canGoBack,
    canGoForward,
    handleGoBack,
    handleGoForward,
    hasBoxToken,
    // [PROTO-CACHE-REFRESH] 2/5（続き）: handleRefresh,
  };
};
