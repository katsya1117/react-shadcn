import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  generatePath,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";
import { ArrowLeft } from "lucide-react";

import type { AutoCompleteData, GetFolderCollaborationsResponse } from "@/api";
import type { BoxFolder } from "@/@types/BoxUiElements";
import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { autoCompleteSelector } from "@/redux/slices/autoCompleteSlice";
import { boxSelector } from "@/redux/slices/userSlice";
import {
  createCollaborations,
  deleteCollaborations,
  getFolderCollaborations,
  ssActions,
  ssSelector,
  updateCollaborations,
} from "@/redux/slices/ssSlice";
import { CollaborationPanel } from "@/components/ss/CollaborationPanel";
import { DEFAULT_ROLE } from "@/components/ss/constants";
import { PathBar } from "@/components/ss/PathBar";
import type {
  CollaborationListItem,
  Collaborator,
  CollaboratorType,
  ContentExplorerInstance,
  FolderInfo,
  RoleType,
} from "@/components/ss/types";
import { UrlPath } from "@/constant/UrlPath";
import { useAppDispatch } from "@/store/hooks";
import { SHARE_AREAS } from "./shareAreaConfig";

const ROOT_SHARE_PATH = "\\share";
// SS は ShareArea から遷移した公開対象フォルダだけを root として扱う。
// URL 直打ちで任意の folderId を渡されても、この集合にないものは画面を開かせない。
const SHARE_AREA_ROUTE_FOLDER_ID_SET = new Set(
  SHARE_AREAS.map((area) => area.boxFolderId),
);

const isShareAreaRouteFolderId = (
  folderId: string | null | undefined,
): folderId is string =>
  typeof folderId === "string" && SHARE_AREA_ROUTE_FOLDER_ID_SET.has(folderId);

const stripCurrentFolderIdFromSearch = (search: string): string => {
  // 旧実装で query に currentFolderId を載せていた名残を無効化する。
  // 現在フォルダは explorer の navigate 結果を正とし、URL では持たない。
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
  // パスバーは常に \share\<showしたroot folder名>\... で始める。
  // Box 全体の root(0) は見せず、show() した rootFolderId より下だけを表示する。
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

const toCollaborationListItem = (
  item: GetFolderCollaborationsResponse,
  currentFolderId: string,
  sourcePathByFolderId: Record<string, string>,
): CollaborationListItem => {
  // Box の folders/:id/collaborations は、現在フォルダの direct だけでなく
  // 親から継承されている collaboration も返す。
  // item.id は collaboration 自体の ID、item.item.id は設定元フォルダの ID。
  const sourceFolderId = item.item?.id ?? currentFolderId;
  const isInherited = sourceFolderId !== currentFolderId;
  // 本アプリでは can_view_path=true の collaboration だけを管理対象として扱う。
  // Box UI 由来の can_view_path=false は一覧には出すが、読み取り専用。
  const canEdit = item.can_view_path ?? item.canViewPath ?? true;

  return {
    collaborator: {
      id: item.id,
      type: item.accessible_by?.type === "group" ? "department" : "user",
      name: item.accessible_by?.name ?? "名称未設定",
      role: item.role,
      canEdit,
      sourceFolderId,
    },
    isInherited,
    canRemove: canEdit,
    sourcePath: isInherited ? sourcePathByFolderId[sourceFolderId] : undefined,
  };
};

type SSContentProps = {
  rootFolderId: string;
};

const PathBarSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="space-y-1">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
    <div className="flex items-center justify-end gap-2">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  </div>
);

const ExplorerRestoreSkeleton = () => (
  <div className="absolute inset-0 z-10 flex flex-col gap-3 bg-background/92 p-4 backdrop-blur-xs">
    <Skeleton className="h-4 w-36" />
    <Skeleton className="h-9 w-full rounded-lg" />
    <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="rounded-xl" />
      ))}
    </div>
  </div>
);

const SSContent = ({ rootFolderId }: SSContentProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const explorerRef = useRef<ContentExplorerInstance | null>(null);
  const dispatch = useAppDispatch();

  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;
  const users = useSelector(autoCompleteSelector.usersSelector());
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const collaborationsByFolderId = useSelector(ssSelector.byFolderIdSelector());
  const rememberedCurrentFolder = useSelector(
    ssSelector.currentFolderSelector(rootFolderId),
  );
  const savedFolderHistory = useSelector(
    ssSelector.folderHistorySelector(rootFolderId),
  );
  const savedHistoryIndex = useSelector(
    ssSelector.historyIndexSelector(rootFolderId),
  );
  const isSavingCollaborator = useSelector(ssSelector.isLoadingSelector());
  const devToken = useMemo(() => {
    if (typeof window === "undefined") return undefined;

    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("devToken")?.trim();
    if (queryToken) return queryToken;

    const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
    return storedToken && storedToken.length > 0 ? storedToken : undefined;
  }, []);
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
      // 初回描画直後は explorer から navigate がまだ飛んでいないので、
      // rootFolderId を仮の currentFolder として先に置いておく。
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
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);

  // フォルダ履歴スタック管理
  const [folderHistory, setFolderHistory] =
    useState<string[]>(initialFolderHistory);
  const [historyIndex, setHistoryIndex] = useState(initialHistoryIndex);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < folderHistory.length - 1;

  const isNavigatingRef = useRef(false);
  const isRestoringDeepFolderRef = useRef(Boolean(restoreTargetFolderId));
  const restoreTargetFolderIdRef = useRef(restoreTargetFolderId);
  const historyIndexRef = useRef(initialHistoryIndex);
  const [isRestoringDeepFolder, setIsRestoringDeepFolder] = useState(
    Boolean(restoreTargetFolderId),
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
    // レイアウトの subtitle は「ShareArea から入ってきた root フォルダ名」を出したい。
    // currentFolder が配下に潜っていても、pathCollection から rootFolderId の名前を拾う。
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
    // 継承元表示用のパス辞書。
    // folders/:id/collaborations の各 row には sourceFolderId(item.id) が入るので、
    // それを \share\...\... に引けるようにしておく。
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
  const currentCollaborationStatus = useSelector(
    ssSelector.collaborationStatusSelector(currentFolder.id),
  );
  const currentCollaborationRows = collaborationsByFolderId[currentFolder.id];
  const collaborators = useMemo<CollaborationListItem[]>(() => {
    // 現在表示中フォルダの API レスポンスだけを表示元にする。
    // 祖先フォルダを個別 fetch してマージはせず、Box が返す inherited 情報をそのまま使う。
    const rows = currentCollaborationRows ?? [];

    return rows.map((item) =>
      toCollaborationListItem(item, currentFolder.id, sourcePathByFolderId),
    );
  }, [currentCollaborationRows, currentFolder.id, sourcePathByFolderId]);
  const isCollaboratorsListLoading =
    isRestoringDeepFolder ||
    (currentCollaborationRows === undefined &&
      (currentCollaborationStatus === "idle" ||
        currentCollaborationStatus === "loading"));

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  const refreshCollaborations = useCallback(async () => {
    // 一覧更新は reducer の局所パッチではなく、常に Box の最新結果を再取得して揃える。
    // unwrap しているので、取得失敗は呼び出し元の try/catch へそのまま返る。
    await dispatch(getFolderCollaborations(currentFolder.id)).unwrap();
  }, [currentFolder.id, dispatch]);

  useEffect(() => {
    if (!location.search.includes("currentFolderId")) return;

    // currentFolderId を URL の truth source にしない方針に統一したので、
    // 残っている query は見つけ次第取り除く。
    const nextSearch = stripCurrentFolderIdFromSearch(location.search);
    navigate(`${rootFolderPath}${nextSearch}`, { replace: true });
  }, [location.search, navigate, rootFolderPath]);

  const handleNavigate = useCallback(
    (payload: BoxFolder) => {
      const nextFolder = toFolderInfo(payload);

      if (isRestoringDeepFolderRef.current) {
        const restoreTargetFolderId = restoreTargetFolderIdRef.current;

        if (restoreTargetFolderId && nextFolder.id === rootFolderId) {
          explorerRef.current?.navigateTo?.(restoreTargetFolderId);
          return;
        }

        if (restoreTargetFolderId && nextFolder.id === restoreTargetFolderId) {
          setCurrentFolder(nextFolder);
          dispatch(
            ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }),
          );
          resetForm();
          isRestoringDeepFolderRef.current = false;
          setIsRestoringDeepFolder(false);
          return;
        }
      }

      // currentFolder は ContentExplorer が通知してきた navigate 結果を正とする。
      setCurrentFolder(nextFolder);
      dispatch(
        ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }),
      );
      resetForm();

      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      setFolderHistory((prev) => {
        // パンくずクリックなどで既に履歴内にあるフォルダへ移動した場合は、
        // 新しい履歴を積まずにその位置へ index だけ戻す/進める。
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
    [dispatch, resetForm, rootFolderId, updateHistoryIndex],
  );

  useEffect(() => {
    if (isRestoringDeepFolder) return;

    // 初回表示時、および explorer で階層を移動して currentFolder が変わった時に
    // そのフォルダ視点の collaborations を再取得する。
    void refreshCollaborations().catch(() => {
      toast.error("コラボレーター一覧の取得に失敗しました");
    });
  }, [isRestoringDeepFolder, refreshCollaborations]);

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

  useEffect(() => {
    if (!accessToken) return;

    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;

    if (!explorerRef.current) {
      explorerRef.current = new BoxGlobal.ContentExplorer();
    }

    const explorer = explorerRef.current;
    if (!explorer) return;
    // listener を付けた状態で show() する。
    // 初期表示と復元時の navigate を同じハンドラで受けて currentFolder を揃える。
    explorer.removeAllListeners?.();
    explorer.addListener?.("navigate", handleNavigate);
    explorer.show(rootFolderId, accessToken, {
      container: "#box-content-explorer",
      canPreview: false,
      size: "large",
    });

    return () => {
      explorer.removeAllListeners?.();
      explorer.hide?.();
    };
  }, [accessToken, handleNavigate, rootFolderId]);

  const handleAddCollaborator = useCallback(async () => {
    if (!selectedCollaborator) return;

    const collaboratorType: CollaboratorType = groups.some(
      (group) => group.value === selectedCollaborator.value,
    )
      ? "department"
      : users.some((user) => user.value === selectedCollaborator.value)
        ? "user"
        : "user";
    const nextCollaborator: Collaborator = {
      id: `${currentFolder.id}:${collaboratorType}:${selectedCollaborator.value}`,
      type: collaboratorType,
      name: selectedCollaborator.label,
      role: selectedRole,
      canEdit: true,
      sourceFolderId: currentFolder.id,
    };
    const existingRows = collaborationsByFolderId[currentFolder.id] ?? [];
    const accessibleByType =
      collaboratorType === "department" ? "group" : "user";
    const duplicatedCollaboration = existingRows.find((item) => {
      // 本アプリ経由で管理するのは can_view_path=true の collaboration だけ。
      // そのため重複禁止も can_view_path=true 同士だけを対象にする。
      // Box UI で作られた can_view_path=false は一覧には見せるが、追加ブロックには使わない。
      const canManage = item.can_view_path ?? item.canViewPath ?? true;

      return (
        canManage &&
        item.accessible_by?.id === selectedCollaborator.value &&
        item.accessible_by?.type === accessibleByType
      );
    });

    if (duplicatedCollaboration) {
      // 親フォルダで既に can_view_path=true が設定されていれば、
      // currentFolder のレスポンスに inherited として乗ってくるのでここで止められる。
      toast.error("同じコラボレーターは既に設定されています");
      return;
    }

    try {
      // mutation thunk は API 1 回だけを責務にしている。
      // UI が成功/失敗を判断できるよう unwrap し、失敗はここで catch する。
      await dispatch(
        createCollaborations({
          folderId: currentFolder.id,
          collaboratorId: selectedCollaborator.value,
          collaboratorType,
          collaboratorName: nextCollaborator.name,
          role: selectedRole,
          can_view_path: true,
        }),
      ).unwrap();
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "コラボレーターの追加に失敗しました",
      );
      return;
    }

    try {
      // 追加成功後に一覧を再取得して、親子関係を含む最終状態を Box のレスポンスで揃える。
      await refreshCollaborations();
      toast.success(`${nextCollaborator.name} を追加しました`);
      setSelectedCollaborator(null);
    } catch {
      toast.error("追加は完了しましたが一覧の更新に失敗しました");
    }
  }, [
    collaborationsByFolderId,
    currentFolder.id,
    dispatch,
    groups,
    refreshCollaborations,
    selectedCollaborator,
    selectedRole,
    users,
  ]);

  const handleRemoveCollaborator = useCallback(
    async (collaborator: Collaborator) => {
      try {
        // collaborator.id は画面用の user/group ID ではなく collaboration レコードの ID。
        // Box API はこの collaborationId を受け取って削除する。
        await dispatch(
          deleteCollaborations({
            collaborationId: collaborator.id,
          }),
        ).unwrap();
      } catch {
        toast.error("コラボレーターの削除に失敗しました");
        return;
      }

      try {
        // 削除対象が inherited でも、sourceFolderId 側の collaboration を触った結果が
        // currentFolder の表示へどう反映されたかは再取得で確定させる。
        await refreshCollaborations();
        toast.success(`${collaborator.name} を削除しました`);
      } catch {
        toast.error("削除は完了しましたが一覧の更新に失敗しました");
      }
    },
    [dispatch, refreshCollaborations],
  );

  const handleUpdateCollaboratorRole = useCallback(
    async (collaborator: Collaborator, role: RoleType) => {
      try {
        // ロール更新も collaborationId 単位の操作。
        // inherited 行でも can_view_path=true なら、継承元 collaboration を更新する。
        await dispatch(
          updateCollaborations({
            collaborationId: collaborator.id,
            params: { role },
          }),
        ).unwrap();
      } catch (error) {
        toast.error(
          typeof error === "string"
            ? error
            : "コラボレーターのロール更新に失敗しました",
        );
        return;
      }

      try {
        // 更新後の一覧は Box を再取得して、ロール変更後の direct / inherited 表示を同期する。
        await refreshCollaborations();
        toast.success(`${collaborator.name} のロールを更新しました`);
      } catch {
        toast.error("更新は完了しましたが一覧の更新に失敗しました");
      }
    },
    [dispatch, refreshCollaborations],
  );

  const handleBackToShareArea = useCallback(() => {
    dispatch(ssActions.clearCurrentFolder(rootFolderId));
    dispatch(ssActions.clearFolderHistory(rootFolderId));
    navigate(UrlPath.ShareArea);
  }, [dispatch, navigate, rootFolderId]);

  return (
    <TooltipProvider delayDuration={100}>
      <Layout hideTabs fluid subtitle={layoutSubtitle}>
        <BoxManager />

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:h-full lg:overflow-hidden">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="mb-1 h-8 px-2 text-muted-foreground hover:bg-[color:var(--brand-soft)] hover:text-muted-foreground"
              onClick={handleBackToShareArea}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              センター専用領域に戻る
            </Button>
          </div>

          {isRestoringDeepFolder ? (
            <PathBarSkeleton />
          ) : (
            <PathBar
              folderName={currentFolderName}
              relativePath={currentFolderRelativePath}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
              onCopyPath={handleCopyPath}
              onOpenBox={handleOpenBox}
              onOpenExplorer={handleOpenExplorer}
            />
          )}

          <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:overflow-hidden">
            <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
              <Card className="relative flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
                {accessToken ? (
                  <div
                    id="box-content-explorer"
                    className="h-full min-h-96 flex-1 [&_.be-logo]:hidden [&_.be-logo-container]:hidden [&_.be-header]:pl-3"
                  />
                ) : (
                  <div className="flex min-h-96 flex-1 items-center justify-center text-sm text-muted-foreground">
                    Box に接続中...
                  </div>
                )}
                {isRestoringDeepFolder ? <ExplorerRestoreSkeleton /> : null}
              </Card>
            </div>

            <div className="flex max-h-[72dvh] flex-col overflow-hidden lg:h-full lg:min-h-0 lg:flex-1 lg:w-96 lg:shrink-0 lg:self-stretch">
              <CollaborationPanel
                className="max-h-full lg:h-full lg:min-h-0"
                folderName={rememberedCurrentFolder?.name || currentFolderName}
                collaborators={collaborators}
                isListLoading={isCollaboratorsListLoading}
                isBusy={isSavingCollaborator}
                selectedCollaborator={selectedCollaborator}
                selectedRole={selectedRole}
                onSelectedCollaboratorChange={setSelectedCollaborator}
                onSelectedRoleChange={setSelectedRole}
                onAddCollaborator={handleAddCollaborator}
                onUpdateCollaboratorRole={handleUpdateCollaboratorRole}
                onRemoveCollaborator={handleRemoveCollaborator}
              />
            </div>
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export const SS = () => {
  const { rootFolderId: routeFolderId } = useParams();

  if (!isShareAreaRouteFolderId(routeFolderId)) {
    return <Navigate replace to={UrlPath.ShareArea} />;
  }

  return <SSContent key={routeFolderId} rootFolderId={routeFolderId} />;
};

export default SS;
