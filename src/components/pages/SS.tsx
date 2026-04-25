import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";
import { ArrowLeft } from "lucide-react";

import type { AutoCompleteData, GetFolderCollaborationsResponse } from "@/api";
import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { Button } from "@/components/ui/button";
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
import { CollaborationPanel } from "@/components/ss/CollaborationPanel";
import { DEFAULT_ROLE } from "@/components/ss/constants";
import { PathBar } from "@/components/ss/PathBar";
import { useBoxExplorer } from "@/components/ss/useBoxExplorer";
import type {
  CollaborationListItem,
  Collaborator,
  CollaboratorType,
  RoleType,
} from "@/components/ss/types";
import { UrlPath } from "@/constant/UrlPath";
import { useAppDispatch } from "@/store/hooks";
import { SHARE_AREAS } from "./shareAreaConfig";

// SS は ShareArea から遷移した公開対象フォルダだけを root として扱う。
// URL 直打ちで任意の folderId を渡されても、この集合にないものは画面を開かせない。
const SHARE_AREA_ROUTE_FOLDER_ID_SET = new Set(
  SHARE_AREAS.map((area) => area.boxFolderId),
);

const isShareAreaRouteFolderId = (
  folderId: string | null | undefined,
): folderId is string =>
  typeof folderId === "string" && SHARE_AREA_ROUTE_FOLDER_ID_SET.has(folderId);

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
  // ShareArea で選択された領域の folderName（例: "JCLGD1SWDV"）
  // Layout の subtitle として常に表示（Explorer で潜ったフォルダ名ではなく root 領域の folderName で固定）
  areaFolderName: string;
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

const SSContent = ({ rootFolderId, areaFolderName }: SSContentProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const users = useSelector(autoCompleteSelector.usersSelector());
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const collaborationsByFolderId = useSelector(ssSelector.byFolderIdSelector());
  const isSavingCollaborator = useSelector(ssSelector.isLoadingSelector());
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  const {
    accessToken,
    canGoBack,
    canGoForward,
    containerId,
    currentFolder,
    currentFolderName,
    currentFolderRelativePath,
    handleCopyPath,
    handleGoBack,
    handleGoForward,
    handleOpenBox,
    handleOpenExplorer,
    isRestoringDeepFolder,
    sourcePathByFolderId,
  } = useBoxExplorer({
    rootFolderId,
    onCurrentFolderChange: resetForm,
  });

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

  const refreshCollaborations = useCallback(async () => {
    // 一覧更新は reducer の局所パッチではなく、常に Box の最新結果を再取得して揃える。
    // unwrap しているので、取得失敗は呼び出し元の try/catch へそのまま返る。
    await dispatch(getFolderCollaborations(currentFolder.id)).unwrap();
  }, [currentFolder.id, dispatch]);

  useEffect(() => {
    if (isRestoringDeepFolder) return;

    // 初回表示時、および explorer で階層を移動して currentFolder が変わった時に
    // そのフォルダ視点の collaborations を再取得する。
    void refreshCollaborations().catch(() => {
      toast.error("コラボレーター一覧の取得に失敗しました");
    });
  }, [isRestoringDeepFolder, refreshCollaborations]);

  const handleAddCollaborator = useCallback(async () => {
    if (!selectedCollaborator) return;

    const collaboratorType: CollaboratorType = groups.some(
      (group) => group.value === selectedCollaborator.value,
    ) ? "department" : "user";
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
      <Layout fluid subtitle={areaFolderName}>
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
                    id={containerId}
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

  // SHARE_AREAS から対象領域を引いて folderName を渡す
  // isShareAreaRouteFolderId で存在確認済みなので non-null assertion は安全
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const areaFolderName = SHARE_AREAS.find((a) => a.boxFolderId === routeFolderId)!.folderName;

  return <SSContent key={routeFolderId} rootFolderId={routeFolderId} areaFolderName={areaFolderName} />;
};

export default SS;
