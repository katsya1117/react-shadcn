import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";

import type {
  AutoCompleteData,
  CreateCollaborationsParams,
  GetFolderCollaborationsResponse,
} from "@/api";
import { Layout } from "@/components/layout/Layout";
import { BoxManager } from "@/components/common/BoxManager/BoxManager";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { autoCompleteSelector } from "@/redux/slices/autoCompleteSlice";
import {
  createCollaborations,
  deleteCollaborations,
  getFolderCollaborations,
  ssActions,
  ssSelector,
  updateCollaborations,
} from "@/redux/slices/ssSlice";
import { boxSelector, userSelector } from "@/redux/slices/userSlice";
import { CollaborationPanel } from "@/components/ss/CollaborationPanel";
import { PathBar } from "@/components/ss/PathBar";
import { useBoxExplorer } from "@/hooks/useBoxExplorer";
import { useAppDispatch } from "@/redux/hooks";
import { DEFAULT_ROLE, DISPLAY_PATH_ROOT } from "@/constants/ssConstants";
import { UrlPath } from "@/constants/UrlPath";
import { SHARE_AREAS } from "@/config/shareAreaConfig";
import type {
  CollaborationListItem,
  Collaborator,
  CollaboratorType,
  ContentExplorerInstance,
  FolderInfo,
  RoleType,
} from "@/types/ss";
import type { BoxFolder } from "@/types/BoxUiElements";

// SS は ShareArea から遷移した公開対象フォルダだけを root として扱う。
// URL 直打ちで任意の folderId を渡されても、この集合にないものは画面を開かせない。
const SHARE_AREA_ROUTE_FOLDER_ID_SET = new Set(
  SHARE_AREAS.map((area) => area.boxFolderId),
);

const isShareAreaRouteFolderId = (
  folderId: string | null | undefined,
): folderId is string =>
  typeof folderId === "string" && SHARE_AREA_ROUTE_FOLDER_ID_SET.has(folderId);

/**
 * 現在フォルダのパス（フル / 相対）を組み立てる。
 * Box の path_collection からルート（id="0"）を除いて UNC 風に連結する。
 */
const buildPath = (folder: FolderInfo) => {
  if (!folder.id || folder.id === "0") {
    return { fullPath: DISPLAY_PATH_ROOT, relativePath: "" };
  }
  const entries = folder.pathCollection?.entries ?? [];
  const filteredEntries = entries.filter((entry) => entry.id !== "0");
  const segments = [
    ...filteredEntries.map((entry) => entry.name),
    folder.name,
  ].filter(Boolean);
  const fullPath = `${DISPLAY_PATH_ROOT}${segments.join("\\")}`;
  const relativePath = fullPath.slice(DISPLAY_PATH_ROOT.length);
  return { fullPath, relativePath };
};

/**
 * 継承元フォルダ ID から、その絶対パス文字列を引くためのマップを作る。
 * inherited collaboration の表示で「どのフォルダから継承されているか」を出すのに使う。
 */
const buildSourcePathByFolderId = (
  currentFolder: FolderInfo,
): Record<string, string> => {
  const entries =
    currentFolder.pathCollection?.entries.filter((e) => e.id !== "0") ?? [];
  const pathMap: Record<string, string> = {};
  let currentPath = DISPLAY_PATH_ROOT.replace(/\\$/, "");
  pathMap["0"] = DISPLAY_PATH_ROOT;
  for (const entry of entries) {
    currentPath += `\\${entry.name}`;
    pathMap[entry.id] = currentPath;
  }
  // currentFolder 自身も登録
  if (currentFolder.id && currentFolder.id !== "0") {
    pathMap[currentFolder.id] = `${currentPath}\\${currentFolder.name}`;
  }
  return pathMap;
};

/**
 * Box API のレスポンス1件を画面表示用に正規化する純粋関数。
 * - direct/inherited の判定
 * - can_view_path の表記揺れ対応
 * - sourcePath（継承元のパス）の付与
 */
const toCollaborationListItem = (
  item: GetFolderCollaborationsResponse,
  currentFolderId: string,
  sourcePathByFolderId: Record<string, string>,
): CollaborationListItem => {
  const sourceFolderId = item.item?.id ?? currentFolderId;
  const isInherited = sourceFolderId !== currentFolderId;
  // 本アプリでは can_view_path=true の collaboration だけを管理対象として扱う。
  // Box UI 由来の can_view_path=false は一覧には出すが読み取り専用。
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

// ===== Skeletons（コンポーネント外に切り出し、必要に応じて他から再利用できるよう named export） =====

export const PathBarSkeleton = () => (
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

export const ExplorerRestoreSkeleton = () => (
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

export const CollaborationPanelSkeleton = () => (
  <div className="flex h-full flex-col gap-4 rounded-xl border bg-background p-4">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-9 w-full" />
    <div className="flex justify-end">
      <Skeleton className="h-9 w-28" />
    </div>
    <Skeleton className="h-px w-full" />
    <div className="flex-1 space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  </div>
);

// =================================================================================================

type SSContentProps = {
  rootFolderId: string;
  /** ShareArea で選択された領域の表示名（例: "JCLGD1SWDV"）。Layout のサブタイトルに使う。 */
  areaFolderName: string;
};

const SSContent = ({ rootFolderId, areaFolderName }: SSContentProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ----- Selectors -----
  const isLogin = useSelector(userSelector.isLoginSelector());
  const userCd = useSelector(userSelector.loginUserCdSelector());
  const token = useSelector(boxSelector.tokenSelector());
  const accessToken =
    token?.accessToken ?? localStorage.getItem("box_dev_token") ?? undefined;
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const collaborationsByFolderId = useSelector(ssSelector.byFolderIdSelector());
  const isSavingCollaborator = useSelector(ssSelector.isLoadingSelector());
  const rememberedCurrentFolder = useSelector(
    ssSelector.currentFolderSelector(rootFolderId),
  );
  const savedFolderHistory = useSelector(
    ssSelector.folderHistorySelector(rootFolderId),
  );
  const savedHistoryIndex = useSelector(
    ssSelector.historyIndexSelector(rootFolderId),
  );

  // ----- 初期値（Redux から復元） -----
  const initialFolder = useMemo<FolderInfo>(
    () =>
      rememberedCurrentFolder ?? {
        id: rootFolderId,
        name: "",
        pathCollection: { entries: [] },
      },
    [rememberedCurrentFolder, rootFolderId],
  );

  const initialHistory = useMemo(() => {
    let history = savedFolderHistory.filter(Boolean);
    if (history.length === 0 || history[0] !== rootFolderId) {
      history = [rootFolderId, ...history.filter((id) => id !== rootFolderId)];
    }
    return history;
  }, [rootFolderId, savedFolderHistory]);

  // ルートと違うフォルダで離脱していたら「復元先」として渡す
  const restoreTargetId =
    rememberedCurrentFolder && rememberedCurrentFolder.id !== rootFolderId
      ? rememberedCurrentFolder.id
      : undefined;

  // ----- フォルダ移動の状態管理（hook） -----
  const {
    explorerRef,
    currentFolder,
    isRestoring,
    canGoBack,
    canGoForward,
    handleNavigate,
    handleGoBack,
    handleGoForward,
  } = useBoxExplorer({
    rootFolderId,
    initialFolder,
    savedHistory: initialHistory,
    savedIndex: savedHistoryIndex,
    restoreTargetId,
  });

  // ----- フォーム状態（コラボ追加） -----
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  // フォルダが変わったら入力中のフォームをリセット
  useEffect(() => {
    resetForm();
  }, [currentFolder.id, resetForm]);

  // ----- パス組み立て -----
  const { fullPath, relativePath } = useMemo(
    () => buildPath(currentFolder),
    [currentFolder],
  );
  const sourcePathByFolderId = useMemo(
    () => buildSourcePathByFolderId(currentFolder),
    [currentFolder],
  );
  const currentFolderName = currentFolder.name || "対象フォルダ";

  // ----- Box SDK のライフサイクル管理 -----
  const [explorerInstance, setExplorerInstance] = useState<
    ContentExplorerInstance | undefined
  >(undefined);

  // SDK インスタンスを生成して explorerRef にも差し込む（hook 側はこの ref を介して navigateTo を呼ぶ）
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (explorerInstance) return;
    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;
    const explorer = new BoxGlobal.ContentExplorer();
    setExplorerInstance(explorer);
    explorerRef.current = explorer;
  }, [explorerInstance, explorerRef]);

  // ログイン済み & トークンがあれば Explorer を表示
  useEffect(() => {
    if (!explorerInstance || !isLogin || !accessToken) return;
    explorerInstance.show(rootFolderId, accessToken, {
      container: ".box-container",
      canPreview: false,
      size: "large",
    });
  }, [explorerInstance, rootFolderId, accessToken, isLogin]);

  // navigate イベントを useBoxExplorer の handleNavigate に流し込む
  useEffect(() => {
    if (!explorerInstance) return;
    const listener = (item: BoxFolder) => handleNavigate(item);
    explorerInstance.removeAllListeners?.();
    explorerInstance.addListener?.("navigate", listener);
    return () => {
      explorerInstance.removeAllListeners?.();
    };
  }, [explorerInstance, handleNavigate]);

  // ----- コラボレータ取得 -----
  const currentCollaborationStatus = useSelector(
    ssSelector.collaborationStatusSelector(currentFolder.id),
  );
  const currentCollaborationRows = collaborationsByFolderId[currentFolder.id];

  const collaborators = useMemo<CollaborationListItem[]>(() => {
    const rows = currentCollaborationRows ?? [];
    return rows
      .map((item) =>
        toCollaborationListItem(item, currentFolder.id, sourcePathByFolderId),
      )
      .sort((a, b) => {
        // 編集可 → 直接設定 → タイプ順 でソート
        return (
          Number(b.collaborator.canEdit) - Number(a.collaborator.canEdit) ||
          Number(a.isInherited) - Number(b.isInherited) ||
          (a.collaborator.type < b.collaborator.type ? -1 : 1)
        );
      });
  }, [currentCollaborationRows, currentFolder.id, sourcePathByFolderId]);

  const isCollaboratorsListLoading =
    isRestoring ||
    (currentCollaborationRows === undefined &&
      (currentCollaborationStatus === "idle" ||
        currentCollaborationStatus === "loading"));

  const refreshCollaborations = useCallback(async () => {
    // 一覧更新は reducer の局所パッチではなく、常に Box の最新結果を再取得して揃える。
    await dispatch(getFolderCollaborations(currentFolder.id)).unwrap();
  }, [currentFolder.id, dispatch]);

  useEffect(() => {
    if (isRestoring) return;
    void refreshCollaborations().catch(() => {
      toast.error("コラボレーター一覧の取得に失敗しました");
    });
  }, [isRestoring, refreshCollaborations]);

  // ----- パスバーのアクション -----

  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullPath);
      toast.success("パスをコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  }, [fullPath]);

  const handleOpenBox = useCallback(() => {
    window.open(
      `https://app.box.com/folder/${currentFolder.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [currentFolder.id]);

  // ローカルの Box Drive を開く（カスタム URI スキーム経由）
  const handleOpenExplorer = useCallback(() => {
    const boxDriveRoot = `C:\\Users\\${userCd ?? ""}\\Box`;
    const entrySegments =
      currentFolder.pathCollection?.entries
        .filter((entry) => entry.id !== "0")
        .map((entry) => entry.name) ?? [];
    const localPath = [
      boxDriveRoot,
      ...entrySegments,
      currentFolder.name,
    ]
      .filter(Boolean)
      .join("\\");
    const uri = `isexplorer:${encodeURIComponent(localPath)}`;
    window.open(uri, "_blank");
  }, [userCd, currentFolder]);

  const handleBackToShareArea = useCallback(() => {
    dispatch(ssActions.clearCurrentFolder(rootFolderId));
    dispatch(ssActions.clearFolderHistory(rootFolderId));
    navigate(UrlPath.ShareArea);
  }, [dispatch, navigate, rootFolderId]);

  // ----- コラボレータ操作 -----

  const handleAddCollaborator = useCallback(async () => {
    if (!selectedCollaborator) return;

    const collaboratorType: CollaboratorType = groups.some(
      (group) => group.value === selectedCollaborator.value,
    )
      ? "department"
      : "user";

    const accessibleByType =
      collaboratorType === "department" ? "group" : "user";

    // 重複チェック：can_view_path=true の collaboration 同士のみが対象。
    // Box UI 経由で作られた can_view_path=false は重複ブロックには使わない（一覧には出すが管理対象外）。
    const existingRows = collaborationsByFolderId[currentFolder.id] ?? [];
    const duplicated = existingRows.find((item) => {
      const canManage = item.can_view_path ?? item.canViewPath ?? true;
      return (
        canManage &&
        item.accessible_by?.id === selectedCollaborator.value &&
        item.accessible_by?.type === accessibleByType
      );
    });
    if (duplicated) {
      toast.error("同じコラボレーターは既に設定されています");
      return;
    }

    const params: CreateCollaborationsParams = {
      folderId: currentFolder.id,
      collaboratorId: selectedCollaborator.value,
      collaboratorType,
      collaboratorName: selectedCollaborator.label,
      role: selectedRole,
      can_view_path: true,
    };

    try {
      // mutation thunk は API 1 回だけを責務にしている。
      await dispatch(createCollaborations(params)).unwrap();
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "コラボレーターの追加に失敗しました",
      );
      return;
    }

    try {
      // 成功後に一覧を再取得して、親子関係を含む最終状態を Box のレスポンスで揃える。
      await refreshCollaborations();
      toast.success(`${selectedCollaborator.label} を追加しました`);
      resetForm();
    } catch {
      toast.error("追加は完了しましたが一覧の更新に失敗しました");
    }
  }, [
    collaborationsByFolderId,
    currentFolder.id,
    dispatch,
    groups,
    refreshCollaborations,
    resetForm,
    selectedCollaborator,
    selectedRole,
  ]);

  const handleRemoveCollaborator = useCallback(
    async (collaborator: Collaborator) => {
      try {
        // collaborator.id は collaboration レコードの ID（user/group ID ではない）。
        await dispatch(
          deleteCollaborations({ collaborationId: collaborator.id }),
        ).unwrap();
      } catch {
        toast.error("コラボレーターの削除に失敗しました");
        return;
      }

      try {
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
        await refreshCollaborations();
        toast.success(`${collaborator.name} のロールを更新しました`);
      } catch {
        toast.error("更新は完了しましたが一覧の更新に失敗しました");
      }
    },
    [dispatch, refreshCollaborations],
  );

  // ----- Render -----

  return (
    <TooltipProvider delayDuration={100}>
      <Layout fluid subtitle={areaFolderName}>
        <BoxManager />

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:overflow-hidden">
          {isRestoring ? (
            <PathBarSkeleton />
          ) : (
            <PathBar
              relativePath={relativePath}
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
                {token?.accessToken ? (
                  <div className="box-container h-full min-h-96 flex-1 [&_.be-logo]:hidden [&_.be-logo-container]:hidden [&_.be-header]:pl-3" />
                ) : (
                  <div className="flex min-h-96 flex-1 items-center justify-center text-sm text-muted-foreground">
                    Box に接続中...
                  </div>
                )}
                {isRestoring ? <ExplorerRestoreSkeleton /> : null}
              </Card>
            </div>

            <div className="flex max-h-[72dvh] flex-col overflow-hidden lg:h-full lg:min-h-0 lg:w-96 lg:shrink-0 lg:self-stretch">
              {isRestoring ? (
                <CollaborationPanelSkeleton />
              ) : (
                <CollaborationPanel
                  className="max-h-full lg:h-full lg:min-h-0"
                  folderName={currentFolderName}
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
              )}
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

  // SHARE_AREAS から対象領域を引いて folderName を渡す。
  // isShareAreaRouteFolderId で存在確認済みなので non-null assertion は安全。
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const areaFolderName = SHARE_AREAS.find(
    (a) => a.boxFolderId === routeFolderId,
  )!.folderName;

  return (
    <SSContent
      key={routeFolderId}
      rootFolderId={routeFolderId}
      areaFolderName={areaFolderName}
    />
  );
};

export default SS;
