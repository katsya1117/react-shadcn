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

const stripCurrentFolderIdFromSearch = (search: string): string => {
  const params = new URLSearchParams(search);
  params.delete("currentFolderId");

  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : "";
};

const toFolderInfo = (folder: BoxFolder): FolderInfo => {
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

const buildSharePath = (folder: FolderInfo, rootFolderId: string): string => {
  const entries = folder.pathCollection?.entries ?? [];
  const filteredEntries = entries.filter((entry) => entry.id !== "0");
  const rootIndex = filteredEntries.findIndex(
    (entry) => entry.id === rootFolderId,
  );
  const visibleEntries = rootIndex >= 0 ? filteredEntries.slice(rootIndex) : [];
  const [rootEntry, ...descendantEntries] = visibleEntries;
  const segments = [ROOT_SHARE_PATH];
  const rootName =
    rootEntry?.name ?? (folder.id === rootFolderId ? folder.name : undefined);

  if (rootName) {
    segments.push(rootName);
  }

  segments.push(
    ...descendantEntries
      .map((entry) => entry.name)
      .filter((name): name is string => Boolean(name)),
  );

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
  const explorerRef = useRef<ContentExplorerInstance | null>(null);
  const onCurrentFolderChangeRef = useRef(onCurrentFolderChange);
  const dispatch = useAppDispatch();

  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;
  const rememberedCurrentFolder = useSelector(
    ssSelector.currentFolderSelector(rootFolderId),
  );
  const savedFolderHistory = useSelector(
    ssSelector.folderHistorySelector(rootFolderId),
  );
  const savedHistoryIndex = useSelector(
    ssSelector.historyIndexSelector(rootFolderId),
  );

  useEffect(() => {
    onCurrentFolderChangeRef.current = onCurrentFolderChange;
  }, [onCurrentFolderChange]);

  const devToken = useMemo(() => {
    if (typeof window === "undefined") return undefined;

    const params = new URLSearchParams(location.search);
    const queryToken = params.get("devToken")?.trim();
    if (queryToken) return queryToken;

    const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
    return storedToken && storedToken.length > 0 ? storedToken : undefined;
  }, [location.search]);
  const accessToken = devToken ?? token;

  const rememberedRootFolder =
    rememberedCurrentFolder?.id === rootFolderId
      ? rememberedCurrentFolder
      : undefined;
  const restoreTargetFolderId =
    rememberedCurrentFolder && rememberedCurrentFolder.id !== rootFolderId
      ? rememberedCurrentFolder.id
      : undefined;

  const initialFolder = useMemo<FolderInfo>(
    () => ({
      id: rootFolderId,
      name: rememberedRootFolder?.name ?? "",
      pathCollection: rememberedRootFolder?.pathCollection ?? {
        entries: [],
      },
    }),
    [rememberedRootFolder, rootFolderId],
  );
  const initialFolderHistory = useMemo(() => {
    let folderHistory = savedFolderHistory.filter(Boolean);

    if (folderHistory.length === 0 || folderHistory[0] !== rootFolderId) {
      folderHistory = [
        rootFolderId,
        ...folderHistory.filter((folderId) => folderId !== rootFolderId),
      ];
    }

    const rememberedFolderId = rememberedCurrentFolder?.id;
    if (rememberedFolderId && !folderHistory.includes(rememberedFolderId)) {
      folderHistory = [...folderHistory, rememberedFolderId];
    }

    return folderHistory;
  }, [rememberedCurrentFolder, rootFolderId, savedFolderHistory]);
  const initialHistoryIndex = useMemo(() => {
    const rememberedFolderId = rememberedCurrentFolder?.id;
    const rememberedIndex =
      rememberedFolderId != null
        ? initialFolderHistory.lastIndexOf(rememberedFolderId)
        : savedHistoryIndex;

    return rememberedIndex >= 0 && rememberedIndex < initialFolderHistory.length
      ? rememberedIndex
      : 0;
  }, [
    initialFolderHistory,
    rememberedCurrentFolder,
    savedHistoryIndex,
  ]);
  const rootFolderPath = generatePath(UrlPath.SS, { rootFolderId });

  const [currentFolder, setCurrentFolder] = useState<FolderInfo>(
    rememberedCurrentFolder ?? initialFolder,
  );
  const [folderHistory, setFolderHistory] =
    useState<string[]>(initialFolderHistory);
  const [historyIndex, setHistoryIndex] = useState(initialHistoryIndex);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < folderHistory.length - 1;

  const isNavigatingRef = useRef(false);
  const isRestoringDeepFolderRef = useRef(Boolean(restoreTargetFolderId));
  const restoreTargetFolderIdRef = useRef(restoreTargetFolderId);
  const historyIndexRef = useRef(initialHistoryIndex);
  const handleNavigateRef = useRef<(payload: BoxFolder) => void>(() => {});
  const [isRestoringDeepFolder, setIsRestoringDeepFolder] = useState(
    Boolean(restoreTargetFolderId),
  );

  const commitCurrentFolder = useCallback(
    (folder: FolderInfo) => {
      setCurrentFolder(folder);
      dispatch(ssActions.setCurrentFolder({ rootFolderId, folder }));
      onCurrentFolderChangeRef.current?.(folder);
    },
    [dispatch, rootFolderId],
  );

  const updateHistoryIndex = useCallback(
    (next: number, history?: string[]) => {
      const nextHistory = history ?? folderHistory;
      historyIndexRef.current = next;
      setHistoryIndex(next);
      dispatch(
        ssActions.setFolderHistory({
          rootFolderId,
          history: nextHistory,
          index: next,
        }),
      );
    },
    [dispatch, folderHistory, rootFolderId],
  );

  const handleGoBack = useCallback(() => {
    if (!canGoBack) return;
    const nextIndex = historyIndexRef.current - 1;
    const folderId = folderHistory[nextIndex];
    if (!folderId) return;
    isNavigatingRef.current = true;
    updateHistoryIndex(nextIndex, folderHistory);
    explorerRef.current?.navigateTo?.(folderId);
  }, [canGoBack, folderHistory, updateHistoryIndex]);

  const handleGoForward = useCallback(() => {
    if (!canGoForward) return;
    const nextIndex = historyIndexRef.current + 1;
    const folderId = folderHistory[nextIndex];
    if (!folderId) return;
    isNavigatingRef.current = true;
    updateHistoryIndex(nextIndex, folderHistory);
    explorerRef.current?.navigateTo?.(folderId);
  }, [canGoForward, folderHistory, updateHistoryIndex]);

  const { currentFolderPath, currentFolderRelativePath } = useMemo(() => {
    const fullPath = buildSharePath(currentFolder, rootFolderId);
    const relativePath =
      fullPath === ROOT_SHARE_PATH
        ? ""
        : fullPath.startsWith(`${ROOT_SHARE_PATH}\\`)
          ? fullPath.slice(`${ROOT_SHARE_PATH}\\`.length)
          : fullPath;

    return {
      currentFolderPath: fullPath,
      currentFolderRelativePath: relativePath,
    };
  }, [currentFolder, rootFolderId]);
  const currentFolderName = currentFolder.name || "対象フォルダ";
  const layoutSubtitle = useMemo(() => {
    if (currentFolder.id === rootFolderId && currentFolder.name) {
      return currentFolder.name;
    }

    return currentFolder.pathCollection?.entries?.find(
      (entry) => entry.id === rootFolderId,
    )?.name;
  }, [
    rootFolderId,
    currentFolder.id,
    currentFolder.name,
    currentFolder.pathCollection,
  ]);
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

  useEffect(() => {
    if (!location.search.includes("currentFolderId")) return;

    const nextSearch = stripCurrentFolderIdFromSearch(location.search);
    navigate(`${rootFolderPath}${nextSearch}`, { replace: true });
  }, [location.search, navigate, rootFolderPath]);

  const handleNavigate = useCallback(
    (payload: BoxFolder) => {
      const nextFolder = toFolderInfo(payload);

      if (isRestoringDeepFolderRef.current) {
        const nextRestoreTargetFolderId = restoreTargetFolderIdRef.current;

        if (nextRestoreTargetFolderId && nextFolder.id === rootFolderId) {
          explorerRef.current?.navigateTo?.(nextRestoreTargetFolderId);
          return;
        }

        if (
          nextRestoreTargetFolderId &&
          nextFolder.id === nextRestoreTargetFolderId
        ) {
          commitCurrentFolder(nextFolder);
          isRestoringDeepFolderRef.current = false;
          setIsRestoringDeepFolder(false);
          return;
        }
      }

      commitCurrentFolder(nextFolder);

      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      setFolderHistory((prev) => {
        const currentIndex = historyIndexRef.current;
        const backwardIndex = prev.lastIndexOf(nextFolder.id, currentIndex);

        if (backwardIndex >= 0) {
          updateHistoryIndex(backwardIndex, prev);
          return prev;
        }

        const forwardIndex = prev.indexOf(nextFolder.id, currentIndex + 1);

        if (forwardIndex >= 0) {
          updateHistoryIndex(forwardIndex, prev);
          return prev;
        }

        const trimmed = prev.slice(0, historyIndexRef.current + 1);
        const nextHistory = [...trimmed, nextFolder.id];
        updateHistoryIndex(trimmed.length, nextHistory);
        return nextHistory;
      });
    },
    [commitCurrentFolder, rootFolderId, updateHistoryIndex],
  );

  useEffect(() => {
    handleNavigateRef.current = handleNavigate;
  }, [handleNavigate]);

  useEffect(() => {
    if (!accessToken) return;

    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;

    if (!explorerRef.current) {
      explorerRef.current = new BoxGlobal.ContentExplorer();
    }

    const explorer = explorerRef.current;
    if (!explorer) return;

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

  const handleOpenBox = useCallback(() => {
    window.open(
      `https://app.box.com/folder/${currentFolder.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [currentFolder.id]);

  const handleOpenExplorer = useCallback(() => {
    const fileUrl = `file://${currentFolderPath.replace(/\\/g, "/")}`;
    window.open(fileUrl, "_blank");
    toast.info("エクスプローラーで開きます");
  }, [currentFolderPath]);

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
