import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { generatePath, useLocation, useNavigate } from "react-router";

import type { BoxFolder } from "@/@types/BoxUiElements";
import { UrlPath } from "@/constant/UrlPath";
import { ssActions, ssSelector } from "@/redux/slices/ssSlice";
import { boxSelector } from "@/redux/slices/userSlice";
import { useAppDispatch } from "@/store/hooks";
import { toast } from "@/components/ui/sonner";
import type { ContentExplorerInstance, FolderInfo } from "./types";

const ROOT_SHARE_PATH = "\\share";
const BOX_CONTENT_EXPLORER_CONTAINER_ID = "box-content-explorer";

// URLクエリから currentFolderId パラメータだけ除去した検索文字列を返す
const stripCurrentFolderIdFromSearch = (search: string): string => {
  const params = new URLSearchParams(search);
  params.delete("currentFolderId");
  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : "";
};

// Box API の BoxFolder オブジェクトをアプリ内の FolderInfo 型に変換する
const toFolderInfo = (folder: BoxFolder): FolderInfo => {
  // Box SDK のバージョン差異でキャメルケース/スネークケースが混在するため両方を参照する
  const folderWithPath = folder as BoxFolder & {
    name?: string | null;
    path_collection?: { entries?: { id: string; name?: string | null }[] };
  };
  const pathEntries =
    folderWithPath.path_collection?.entries ??
    folderWithPath.pathCollection ??
    [];

  return {
    id: folder.id,
    name: folder.name ?? "",
    pathCollection:
      pathEntries.length > 0
        ? {
            entries: pathEntries.map((entry) => ({
              id: entry.id,
              name: entry.name ?? "",
            })),
          }
        : undefined,
  };
};

// ルートフォルダからの UNC 形式パス文字列を組み立てる
const buildSharePath = (folder: FolderInfo, rootFolderId: string): string => {
  const entries = folder.pathCollection?.entries ?? [];
  // Box のルート（id: "0"）は表示パスに含めない
  const filteredEntries = entries.filter((entry) => entry.id !== "0");
  // パンくずエントリの中からルートフォルダの位置を特定し、それ以降だけを使う
  const rootIndex = filteredEntries.findIndex(
    (entry) => entry.id === rootFolderId,
  );
  const visibleEntries = rootIndex >= 0 ? filteredEntries.slice(rootIndex) : [];
  const [rootEntry, ...descendantEntries] = visibleEntries;
  const segments = [ROOT_SHARE_PATH];

  // ルートフォルダ自身の名前を先頭セグメントとして追加する
  const rootName =
    rootEntry?.name ?? (folder.id === rootFolderId ? folder.name : undefined);
  if (rootName) {
    segments.push(rootName);
  }

  // ルートより下の中間フォルダ名を順に追加する
  segments.push(
    ...descendantEntries
      .map((entry) => entry.name)
      .filter((name): name is string => Boolean(name)),
  );

  // 現在フォルダがルートでない場合、現在フォルダ名を末尾に追加する
  if (folder.id !== rootFolderId && folder.name) {
    segments.push(folder.name);
  }

  return segments.join("\\");
};

type UseBoxExplorerOptions = {
  rootFolderId: string;
  onCurrentFolderChange?: (folder: FolderInfo) => void;
};

type UseBoxExplorerResult = {
  accessToken: string | undefined;
  canGoBack: boolean;
  canGoForward: boolean;
  containerId: string;
  currentFolder: FolderInfo;
  currentFolderName: string;
  currentFolderPath: string;
  currentFolderRelativePath: string;
  handleCopyPath: () => Promise<void>;
  handleGoBack: () => void;
  handleGoForward: () => void;
  handleOpenBox: () => void;
  handleOpenExplorer: () => void;
  isRestoringDeepFolder: boolean;
  layoutSubtitle: string | undefined;
  sourcePathByFolderId: Record<string, string>;
};

export const useBoxExplorer = ({
  rootFolderId,
  onCurrentFolderChange,
}: UseBoxExplorerOptions): UseBoxExplorerResult => {
  const location = useLocation();
  const navigate = useNavigate();

  // refにする理由：
  // Box SDKのExplorerは画面を何度描き直しても同じものを使い続けなければならない。
  // stateに入れると値が変わるたびに再描画が起きてしまうし、そもそもこのオブジェクトは
  // Reactが管理するものではないので、stateにする意味がない。
  const explorerRef = useRef<ContentExplorerInstance | null>(null);

  // refにする理由：
  // 外から渡されてくる「フォルダが変わったときに呼ぶ関数」を常に最新の状態で使うためにrefへ入れる。
  // この関数をExplorer初期化処理の更新条件に加えると、呼び出し元が毎描画で新しい関数を渡してきた際に
  // Explorerが再起動してしまう。更新条件から外しつつ常に最新の関数を呼べるよう、refに都度セットしておく。
  const onCurrentFolderChangeRef = useRef(onCurrentFolderChange);
  const dispatch = useAppDispatch();

  // Redux から Box アクセストークンを取得する（サーバー発行トークン）
  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;
  // Redux から前回のフォルダ位置を復元する
  const rememberedCurrentFolder = useSelector(
    ssSelector.currentFolderSelector(rootFolderId),
  );
  // Redux からフォルダ履歴を復元する
  const savedFolderHistory = useSelector(
    ssSelector.folderHistorySelector(rootFolderId),
  );
  const savedHistoryIndex = useSelector(
    ssSelector.historyIndexSelector(rootFolderId),
  );

  useEffect(() => {
    onCurrentFolderChangeRef.current = onCurrentFolderChange;
  }, [onCurrentFolderChange]);

  // 開発用トークン：URLクエリ ?devToken=xxx または localStorage の box_dev_token を優先して使用する
  const devToken = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(location.search);
    const queryToken = params.get("devToken")?.trim();
    if (queryToken) return queryToken;
    const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
    return storedToken && storedToken.length > 0 ? storedToken : undefined;
  }, [location.search]);

  // 開発用トークンがあれば優先し、なければサーバー発行トークンを使う
  const accessToken = devToken ?? token;

  // 復元先が現在のルートフォルダ自身かどうかを区別する
  const rememberedRootFolder =
    rememberedCurrentFolder?.id === rootFolderId
      ? rememberedCurrentFolder
      : undefined;
  // ルートより深い位置へ復元が必要なフォルダID（ない場合は undefined）
  const restoreTargetFolderId =
    rememberedCurrentFolder && rememberedCurrentFolder.id !== rootFolderId
      ? rememberedCurrentFolder.id
      : undefined;

  // 初期表示フォルダ：記憶されたルートフォルダ情報があればそれを使い、なければルートIDのみのオブジェクトにする
  const initialFolder = useMemo<FolderInfo>(
    () => ({
      id: rootFolderId,
      name: rememberedRootFolder?.name ?? "",
      pathCollection: rememberedRootFolder?.pathCollection ?? { entries: [] },
    }),
    [rememberedRootFolder, rootFolderId],
  );

  // 初期履歴：ルートフォルダを先頭に保証した上で、保存済みの履歴を復元する
  const initialFolderHistory = useMemo(() => {
    let folderHistory = savedFolderHistory.filter(Boolean);
    if (folderHistory.length === 0 || folderHistory[0] !== rootFolderId) {
      folderHistory = [
        rootFolderId,
        ...folderHistory.filter((folderId) => folderId !== rootFolderId),
      ];
    }
    // 記憶済みフォルダが履歴にない場合は末尾に追加する
    const rememberedFolderId = rememberedCurrentFolder?.id;
    if (rememberedFolderId && !folderHistory.includes(rememberedFolderId)) {
      folderHistory = [...folderHistory, rememberedFolderId];
    }
    return folderHistory;
  }, [rememberedCurrentFolder, rootFolderId, savedFolderHistory]);

  // 初期インデックス：記憶済みフォルダの位置から再開する
  const initialHistoryIndex = useMemo(() => {
    const rememberedFolderId = rememberedCurrentFolder?.id;
    const rememberedIndex =
      rememberedFolderId != null
        ? initialFolderHistory.lastIndexOf(rememberedFolderId)
        : savedHistoryIndex;
    return rememberedIndex >= 0 && rememberedIndex < initialFolderHistory.length
      ? rememberedIndex
      : 0;
  }, [initialFolderHistory, rememberedCurrentFolder, savedHistoryIndex]);

  const rootFolderPath = generatePath(UrlPath.SS, { rootFolderId });

  const [currentFolder, setCurrentFolder] = useState<FolderInfo>(
    rememberedCurrentFolder ?? initialFolder,
  );

  // stateにする理由：canGoBack / canGoForwardの表示に使うため、変化したら画面を再描画する必要がある。
  const [folderHistory, setFolderHistory] =
    useState<string[]>(initialFolderHistory);

  // refにする理由：
  // handleNavigate（SDKのnavigateイベントで呼ばれる関数）は、Explorerが再起動しないよう
  // folderHistoryをその更新条件から外している。
  // そのためhandleNavigateの中ではfolderHistoryが古い値のまま固まってしまう。
  // 同じ値をrefにも入れておくことで、関数の中から常に最新の履歴を読めるようにしている。
  // ※ setFolderHistory(prev => ...)で最新値を読む書き方では解決できない場面がある：
  //   handleGoBack/handleGoForwardで「履歴の特定の位置のID」を直接読み出す必要があるため。
  const folderHistoryRef = useRef<string[]>(initialFolderHistory);

  // stateにする理由：canGoBack / canGoForwardの表示に使うため、変化したら画面を再描画する必要がある。
  const [historyIndex, setHistoryIndex] = useState(initialHistoryIndex);

  // refにする理由：folderHistoryRefと同じ。
  // さらに、handleGoBack/handleGoForwardは「今のインデックスから±1」を計算するが、
  // これらの関数はcanGoBackの値が変わったときだけ作り直される。
  // インデックスが1→2に変わってもcanGoBackはtrueのまま変わらないため関数は作り直されず、
  // 関数の中のインデックスは古い値のままになる。refを使えばこの問題を回避できる。
  const historyIndexRef = useRef(initialHistoryIndex);

  // 戻る・進むが可能かどうかはインデックス位置で判定する
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < folderHistory.length - 1;

  // refにする理由：
  // 「戻る/進むボタンを押した」ことをhandleNavigateに伝えるためのフラグ。
  // ボタンを押すとSDKのnavigateTo()を呼ぶが、SDKはその直後にnavigateイベントを発火する。
  // handleNavigateはそのイベントを受け取るが、「ボタン操作か、ユーザーが自分でクリックしたか」を
  // 区別しないと履歴が2重に更新されてしまう。
  // stateだと「値をセットした→イベントが来た」の間に更新が画面に反映される前に
  // イベントが届いてしまうため、即座に読み書きできるrefを使う。
  const isNavigatingRef = useRef(false);

  // refにする理由：
  // 深いフォルダへの復元が進行中かどうかを表すフラグ。
  // 復元はnavigateイベントを複数回またいで進む（ルート到達→目的フォルダへ移動→到達確認）。
  // stateだと次のイベントが届いたときに値の更新がまだ反映されていないため、refを使う。
  const isRestoringDeepFolderRef = useRef(Boolean(restoreTargetFolderId));

  // refにする理由：isRestoringDeepFolderRefと同じ理由。
  // 復元先のフォルダIDをhandleNavigateの中から参照する必要があるが、
  // Explorer初期化処理の更新条件に加えるとExplorerが再起動してしまうのでrefに入れる。
  // 初期値のみ意味があってその後は変わらない値なので、stateにする必要もない。
  const restoreTargetFolderIdRef = useRef(restoreTargetFolderId);

  // refにする理由：
  // ExplorerのSDKにはイベントリスナーを一度だけ登録したい
  // （登録のし直しはExplorerの再起動を意味するため）。
  // しかしhandleNavigateは内容が変わるたびに新しい関数として作り直される。
  // リスナーにhandleNavigateを直接渡すと古い版が呼ばれ続けてしまう。
  // そこで「refの中の関数を呼ぶだけ」のラッパーをリスナーとして登録し、
  // refには常に最新のhandleNavigateをセットしておくことで両立させている。
  const handleNavigateRef = useRef<(payload: BoxFolder) => void>(() => {});
  const [isRestoringDeepFolder, setIsRestoringDeepFolder] = useState(
    Boolean(restoreTargetFolderId),
  );

  // フォルダ位置を Redux と state の両方に書き込む
  const commitCurrentFolder = useCallback(
    (folder: FolderInfo) => {
      setCurrentFolder(folder);
      dispatch(ssActions.setCurrentFolder({ rootFolderId, folder }));
      onCurrentFolderChangeRef.current?.(folder);
    },
    [dispatch, rootFolderId],
  );

  // 履歴インデックスを更新し、state・ref・Redux の3箇所を同期する
  // history は常に呼び出し元から明示的に渡す（クロージャの古い folderHistory に依存しないため）
  const updateHistoryIndex = useCallback(
    (next: number, history: string[]) => {
      historyIndexRef.current = next;
      setHistoryIndex(next);
      dispatch(
        ssActions.setFolderHistory({
          rootFolderId,
          history,
          index: next,
        }),
      );
    },
    [dispatch, rootFolderId],
  );

  // 「戻る」ボタン：履歴を1つ前に移動し、Box Explorer を対象フォルダへ強制移動する
  const handleGoBack = useCallback(() => {
    if (!canGoBack) return;
    const nextIndex = historyIndexRef.current - 1;
    // ref から最新の履歴を参照することで、stale closure を回避する
    const folderId = folderHistoryRef.current[nextIndex];
    // historyIndexRef と state の更新タイミングのズレで nextIndex が -1 になるケースを防ぐ
    if (!folderId) return;
    // navigate イベントで履歴が二重更新されないようフラグを立てる
    isNavigatingRef.current = true;
    updateHistoryIndex(nextIndex, folderHistoryRef.current);
    explorerRef.current?.navigateTo?.(folderId);
  }, [canGoBack, updateHistoryIndex]);

  // 「進む」ボタン：履歴を1つ先に移動し、Box Explorer を対象フォルダへ強制移動する
  const handleGoForward = useCallback(() => {
    if (!canGoForward) return;
    const nextIndex = historyIndexRef.current + 1;
    const folderId = folderHistoryRef.current[nextIndex];
    if (!folderId) return;
    isNavigatingRef.current = true;
    updateHistoryIndex(nextIndex, folderHistoryRef.current);
    explorerRef.current?.navigateTo?.(folderId);
  }, [canGoForward, updateHistoryIndex]);

  const { currentFolderPath, currentFolderRelativePath } = useMemo(() => {
    const fullPath = buildSharePath(currentFolder, rootFolderId);
    // ルートパスプレフィックスを除いた相対パス文字列を導出する
    const relativePath =
      fullPath === ROOT_SHARE_PATH
        ? ""
        : fullPath.startsWith(`${ROOT_SHARE_PATH}\\`)
          ? fullPath.slice(`${ROOT_SHARE_PATH}\\`.length)
          : fullPath;
    return { currentFolderPath: fullPath, currentFolderRelativePath: relativePath };
  }, [currentFolder, rootFolderId]);

  const currentFolderName = currentFolder.name || "対象フォルダ";

  // レイアウトのサブタイトルとして表示するルートフォルダ名を導出する
  const layoutSubtitle = useMemo(() => {
    // 現在地がルートフォルダ自身であれば、そのフォルダ名を使う
    if (currentFolder.id === rootFolderId && currentFolder.name) {
      return currentFolder.name;
    }
    // パンくずエントリからルートフォルダに相当するエントリを探して名前を取得する
    return currentFolder.pathCollection?.entries?.find(
      (entry) => entry.id === rootFolderId,
    )?.name;
  }, [rootFolderId, currentFolder.id, currentFolder.name, currentFolder.pathCollection]);

  // PathBar 用のパスマップ：フォルダID → UNC パス文字列の対応表を構築する
  const sourcePathByFolderId = useMemo(() => {
    const pathEntries =
      currentFolder.pathCollection?.entries?.filter(
        (entry) => entry.id !== "0",
      ) ?? [];
    const rootIndex = pathEntries.findIndex(
      (entry) => entry.id === rootFolderId,
    );
    const visibleEntries = rootIndex >= 0 ? pathEntries.slice(rootIndex) : [];
    const pathMap: Record<string, string> = {};
    const segments = [ROOT_SHARE_PATH];
    pathMap["0"] = ROOT_SHARE_PATH;
    for (const entry of visibleEntries) {
      if (!entry.name) continue;
      segments.push(entry.name);
      pathMap[entry.id] = segments.join("\\");
    }
    return pathMap;
  }, [currentFolder.pathCollection, rootFolderId]);

  // URLに残った currentFolderId クエリパラメータを除去する（履歴復元後のクリーンアップ）
  useEffect(() => {
    if (!location.search.includes("currentFolderId")) return;
    const nextSearch = stripCurrentFolderIdFromSearch(location.search);
    navigate(`${rootFolderPath}${nextSearch}`, { replace: true });
  }, [location.search, navigate, rootFolderPath]);

  // Box Explorer の navigate イベントを受け取り、履歴と Redux を更新するハンドラ
  const handleNavigate = useCallback(
    (payload: BoxFolder) => {
      const nextFolder = toFolderInfo(payload);

      // 深いフォルダへの復元処理中は通常の履歴更新を行わず、目的フォルダへ誘導する
      if (isRestoringDeepFolderRef.current) {
        const nextRestoreTargetFolderId = restoreTargetFolderIdRef.current;
        if (nextRestoreTargetFolderId && nextFolder.id === rootFolderId) {
          // まずルートに降り立ったので、次に目的フォルダへジャンプする
          explorerRef.current?.navigateTo?.(nextRestoreTargetFolderId);
          return;
        }
        if (nextRestoreTargetFolderId && nextFolder.id === nextRestoreTargetFolderId) {
          // 目的フォルダに到達したので復元完了とする
          commitCurrentFolder(nextFolder);
          isRestoringDeepFolderRef.current = false;
          setIsRestoringDeepFolder(false);
          return;
        }
      }

      commitCurrentFolder(nextFolder);

      // 戻る/進むボタン経由のプログラム的な移動の場合は履歴を書き換えない
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      // ユーザーが自分でフォルダを移動した場合の履歴更新
      setFolderHistory((prev) => {
        const currentIndex = historyIndexRef.current;

        // 現在位置より手前に同じフォルダがある場合：そこへ戻るジャンプとみなしインデックスを巻き戻す
        // パンくずでルートを押した場合もこのケースに該当し、index 0 に戻るため「戻れなくなる」
        // これはブラウザとは異なる挙動だが、ファイルエクスプローラーのパンくず UX として妥当と判断している
        const backwardIndex = prev.lastIndexOf(nextFolder.id, currentIndex);
        if (backwardIndex >= 0) {
          updateHistoryIndex(backwardIndex, prev);
          return prev;
        }

        // 現在位置より先に同じフォルダがある場合：進む方向への移動とみなしインデックスを進める
        const forwardIndex = prev.indexOf(nextFolder.id, currentIndex + 1);
        if (forwardIndex >= 0) {
          updateHistoryIndex(forwardIndex, prev);
          return prev;
        }

        // 履歴にないフォルダへ移動した場合：現在位置より先の履歴を切り捨てて新規エントリを追加する
        const trimmed = prev.slice(0, historyIndexRef.current + 1);
        const nextHistory = [...trimmed, nextFolder.id];
        // ref も同時に更新することで、次のコールバック呼び出しで最新値を参照できるようにする
        folderHistoryRef.current = nextHistory;
        updateHistoryIndex(trimmed.length, nextHistory);
        return nextHistory;
      });
    },
    [commitCurrentFolder, rootFolderId, updateHistoryIndex],
  );

  useEffect(() => {
    handleNavigateRef.current = handleNavigate;
  }, [handleNavigate]);

  // Box Explorer の初期化と navigate イベントの登録
  // accessToken または rootFolderId が変わった場合のみ再マウントする
  useEffect(() => {
    if (!accessToken) return;
    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;

    if (!explorerRef.current) {
      explorerRef.current = new BoxGlobal.ContentExplorer();
    }
    const explorer = explorerRef.current;
    if (!explorer) return;

    // ハンドラを ref 経由で呼ぶことで、useEffect を再実行せずに最新の handleNavigate を使い続ける
    const handleExplorerNavigate = (payload: BoxFolder) => {
      handleNavigateRef.current(payload);
    };

    explorer.removeAllListeners?.();
    explorer.addListener?.("navigate", handleExplorerNavigate);
    explorer.show(rootFolderId, accessToken, {
      container: `#${BOX_CONTENT_EXPLORER_CONTAINER_ID}`,
      canPreview: false,
      size: "large",
    });

    return () => {
      explorer.removeAllListeners?.();
      explorer.hide?.();
    };
  }, [accessToken, rootFolderId]);

  // 現在フォルダを Box の Web UI で開く
  const handleOpenBox = useCallback(() => {
    window.open(
      `https://app.box.com/folder/${currentFolder.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [currentFolder.id]);

  // 現在フォルダの UNC パスをローカルのエクスプローラーで開く
  const handleOpenExplorer = useCallback(() => {
    const fileUrl = `file://${currentFolderPath.replace(/\\/g, "/")}`;
    window.open(fileUrl, "_blank");
    toast.info("エクスプローラーで開きます");
  }, [currentFolderPath]);

  // 現在フォルダのパスをクリップボードにコピーする
  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentFolderPath);
      toast.success("パスをコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  }, [currentFolderPath]);

  return {
    accessToken,
    canGoBack,
    canGoForward,
    containerId: BOX_CONTENT_EXPLORER_CONTAINER_ID,
    currentFolder,
    currentFolderName,
    currentFolderPath,
    currentFolderRelativePath,
    handleCopyPath,
    handleGoBack,
    handleGoForward,
    handleOpenBox,
    handleOpenExplorer,
    isRestoringDeepFolder,
    layoutSubtitle,
    sourcePathByFolderId,
  };
};
