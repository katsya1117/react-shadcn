import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";

import { Layout } from "@/components/layout/Layout";
import { BoxManager } from "@/components/common/BoxManager/BoxManager";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ensureFolderCollaborations,
  getFolderCollaborations,
  ssActions,
  ssSelector,
} from "@/redux/slices/ssSlice";
import { userSelector } from "@/redux/slices/userSlice";
import { CollaborationPanel } from "@/components/ss/CollaborationPanel";
import { useAreaAdminGate } from "@/hooks/useAreaAdminGate";
import { useCollaboratorActions } from "@/hooks/useCollaboratorActions";
import { PathBar } from "@/components/ss/PathBar";
import { LoadingOverlay } from "@/components/common/LoadingOverlay";
import { useBoxExplorer } from "@/hooks/useBoxExplorer";
// [PROTO-CACHE-REFRESH] 1/5: 試作（フォルダ取得キャッシュ・更新ボタン）。未使用。有効にする手順は src/prototypes/box-cache-refresh/README.md
// （この画面の分は、useRefreshAll の import だけ。ほかは src/hooks/useBoxExplorer.ts にある）
// import { useRefreshAll } from "@/prototypes/box-cache-refresh/useExplorerCacheRefresh";
import { useAppDispatch } from "@/redux/hooks";
import { UrlPath } from "@/constants/UrlPath";
import { SHARE_AREAS } from "@/config/shareAreaConfig";
import type { CollaborationListItem, FolderInfo } from "@/types/ss";
import {
  buildPath,
  buildSourcePathByFolderId,
  isShareAreaRouteFolderId,
  toCollaborationListItem,
} from "@/pages/ssHelpers";

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

/** 管理者の確認中に出す表示（Layout 付き。SSContent は、まだ作らない） */
const SSGateSkeleton = () => (
  <Layout fluid>
    <div className="space-y-3 p-4" aria-busy="true">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  </Layout>
);

type SSContentProps = {
  rootFolderId: string;
  /** ShareArea で選択された領域の表示名（例: "JCLGD1SWDV"）。Layout のサブタイトルに使う。 */
  areaFolderName: string;
};

const SSContent = ({ rootFolderId, areaFolderName }: SSContentProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ----- Selectors -----
  const userCd = useSelector(userSelector.loginUserCdSelector());
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

  // ----- Box の Explorer の表示と、フォルダ移動の状態（hook） -----
  const {
    currentFolder,
    isRestoring,
    canGoBack,
    canGoForward,
    handleGoBack,
    handleGoForward,
    hasBoxToken,
    // [PROTO-CACHE-REFRESH] 2/5: 受け取りは src/hooks/useBoxExplorer.ts 側。ここでも handleRefresh を受け取る
    // handleRefresh,
  } = useBoxExplorer({
    rootFolderId,
    initialFolder,
    savedHistory: initialHistory,
    savedIndex: savedHistoryIndex,
    restoreTargetId,
  });

  // [FILE-COLLAB] 1/4: ファイルをコラボレーション対象にする機能（未使用・保留）。（3/4・4/4 は src/hooks/useBoxExplorer.ts にある）
  // 「…」メニューの独自項目（itemActions）で選んだファイルを、コラボレーションの操作対象にする。
  // 未選択のときは、従来どおり「今開いているフォルダ」が対象。設計は docs/spec-box-token-downscope.md の §7。
  // 有効にするときは、[FILE-COLLAB] 1/4〜4/4 のコメントアウトを全て外す（useBoxExplorer に、選んだファイルを渡す口が要る）。
  // 注意: コラボレーションの thunk・キャッシュ・API は、フォルダ ID 前提。ファイル対応（{ type, id } への拡張）が別途要る。
  // const [selectedFile, setSelectedFile] = useState<{
  //   id: string;
  //   name: string;
  // } | null>(null);
  //
  // // フォルダを移動したら、ファイルの選択を解除する
  // useEffect(() => {
  //   setSelectedFile(null);
  // }, [currentFolder.id]);

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

  // [FILE-COLLAB] 2/4: コラボレーションの操作対象（ファイル選択中はファイル、なければ今のフォルダ）。
  // 有効にしたら、下の CollaborationPanel の folderName などを、この値に差し替える。
  // const collabTarget = selectedFile
  //   ? { type: "file" as const, id: selectedFile.id, name: selectedFile.name }
  //   : {
  //       type: "folder" as const,
  //       id: currentFolder.id,
  //       name: currentFolderName,
  //     };

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

  // 一覧は畳んだ状態を初期値とし、開いたときだけ Box から取得する（API 呼び出し回数の削減）。
  // 開いているフォルダ ID で持つことで、フォルダを移動すると自動的に畳んだ状態に戻る。
  const [openListFolderId, setOpenListFolderId] = useState<string | null>(null);
  const isListOpen = openListFolderId === currentFolder.id;
  const handleToggleList = useCallback(() => {
    setOpenListFolderId((prev) =>
      prev === currentFolder.id ? null : currentFolder.id,
    );
  }, [currentFolder.id]);

  // 変更後は、全フォルダの一覧キャッシュを破棄する（親の変更は配下の継承分にも影響するため）。
  // 開いている場合は Box の最新結果を再取得して揃える。畳んでいる場合は次に開いたときに取得する。
  const refreshCollaborations = useCallback(async () => {
    dispatch(ssActions.invalidateCollaborations());
    if (!isListOpen) return;
    await dispatch(getFolderCollaborations(currentFolder.id)).unwrap();
  }, [currentFolder.id, dispatch, isListOpen]);


  // 開いたときに取得する。コラボレーター一覧のキャッシュは既定で無効なので、毎回取得する
  // （有効にしたときは、5 分以内なら取得しない。ssSlice の configureCollaborationsCache）。
  useEffect(() => {
    if (isRestoring || !isListOpen) return;
    void dispatch(ensureFolderCollaborations(currentFolder.id))
      .unwrap()
      .catch(() => {
        toast.error("コラボレーター一覧の取得に失敗しました");
      });
  }, [isRestoring, isListOpen, currentFolder.id, dispatch]);

  // ----- パスバーのアクション -----

  // [PROTO-CACHE-REFRESH] 4/5: 更新ボタンの処理（refreshCollaborations より後ろに置く）。
  // あわせて、src/hooks/useBoxExplorer.ts に、cacheOptions の 1 行を足す（そちらの 4/5（前半））。
  // const handleRefreshAll = useRefreshAll({ handleRefresh, refreshCollaborations });

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

  const handleBackToShareArea = useCallback(/* istanbul ignore next */ () => {
    dispatch(ssActions.clearCurrentFolder(rootFolderId));
    dispatch(ssActions.clearFolderHistory(rootFolderId));
    navigate(UrlPath.ShareArea);
  }, [dispatch, navigate, rootFolderId]);

  // ----- コラボレータ操作（追加フォームの状態を含む） -----
  const {
    selectedCollaborator,
    selectedRole,
    setSelectedCollaborator,
    setSelectedRole,
    isMutating,
    add: handleAddCollaborator,
    remove: handleRemoveCollaborator,
    updateRole: handleUpdateCollaboratorRole,
  } = useCollaboratorActions({
    currentFolderId: currentFolder.id,
    refresh: refreshCollaborations,
  });

  // ----- Render -----

  return (
    <TooltipProvider delayDuration={100}>
      <Layout fluid subtitle={areaFolderName}>
        <BoxManager />

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:overflow-hidden">
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2"
              onClick={handleBackToShareArea}
            >
              <ArrowLeft className="size-4" />
              ShareArea に戻る
            </Button>
          </div>

          {isRestoring ? (
            <PathBarSkeleton />
          ) : (
            <PathBar
              relativePath={relativePath}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
              // [PROTO-CACHE-REFRESH] 5/5: 更新ボタン（渡すと PathBar に出る）
              // onRefresh={() => void handleRefreshAll()}
              onCopyPath={handleCopyPath}
              onOpenBox={handleOpenBox}
              onOpenExplorer={handleOpenExplorer}
            />
          )}

          <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:overflow-hidden">
            <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
              <Card className="relative flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
                {hasBoxToken ? (
                  <div className="box-container h-full min-h-96 flex-1 [&_.be-logo]:hidden [&_.be-logo-container]:hidden [&_.be-header]:pl-3" />
                ) : (
                  <div className="flex min-h-96 flex-1 items-center justify-center text-sm text-muted-foreground">
                    Box に接続中...
                  </div>
                )}
                {isRestoring ? <ExplorerRestoreSkeleton /> : null}
              </Card>
            </div>

            <div className="relative flex max-h-[72dvh] flex-col overflow-hidden lg:h-full lg:min-h-0 lg:w-96 lg:shrink-0 lg:self-stretch">
              {isMutating && <LoadingOverlay />}
              {isRestoring ? (
                <CollaborationPanelSkeleton />
              ) : (
                <CollaborationPanel
                  className="max-h-full lg:h-full lg:min-h-0"
                  folderName={currentFolderName}
                  collaborators={collaborators}
                  isListLoading={isCollaboratorsListLoading}
                  isListOpen={isListOpen}
                  onToggleList={handleToggleList}
                  isBusy={isMutating}
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
  const dispatch = useAppDispatch();
  // 画面に入るたびに、ログインユーザーがその領域の管理者かを、サーバーに確認する。
  // 確認が終わる（"allowed"）まで SSContent を描画しない。これにより、フォルダの復元・Box トークンの取得・
  // Explorer の生成は、権限の確認後にだけ走る（URL 直接指定・他画面から戻る場合も同じ）。
  const gate = useAreaAdminGate(
    isShareAreaRouteFolderId(routeFolderId) ? routeFolderId : undefined,
  );

  // 管理者でなかったら、その領域の復元用の保存状態（現在地・履歴）を破棄する。権限のない人の記録を残さない。
  useEffect(() => {
    if (gate !== "denied" || !routeFolderId) return;
    dispatch(ssActions.clearCurrentFolder(routeFolderId));
    dispatch(ssActions.clearFolderHistory(routeFolderId));
    toast.error("この領域の管理者のみ利用できます");
  }, [gate, routeFolderId, dispatch]);

  if (!isShareAreaRouteFolderId(routeFolderId)) {
    return <Navigate replace to={UrlPath.ShareArea} />;
  }
  if (gate === "denied") {
    return <Navigate replace to={UrlPath.ShareArea} />;
  }
  if (gate === "checking") {
    return <SSGateSkeleton />;
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
