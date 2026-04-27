import type {
  AutoCompleteData,
  CreateCollaborationsParams,
  GetFolderCollaborationsResponse,
} from '@/api';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UrlPath } from '@/constants/UrlPath';
import { autoCompleteSelector } from '@/redux/slices/autoCompleteSlice';
import { shareSelector } from '@/redux/slices/shareSlice';
import {
  createCollaboration,
  deleteCollaboration,
  getFolderCollaborations,
  ssActions,
  ssSelector,
  updateCollaboration,
} from '@/redux/slices/ssSlice';
import { useAppDispatch } from '@/redux/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate, useParams } from 'react-router';
import type { SingleValue } from 'react-select';
import { toast } from 'sonner';
import { boxSelector, userSelector } from '@/redux/slices/userSlice';
import { BoxManager } from '@/components/common/BoxManager/BoxManager';
import { CollaborationPanel } from '@/components/ss/CollaborationPanel';
import { DEFAULT_ROLE, DISPLAY_PATH_ROOT } from '@/constants/ssConstants';
import { PathBar } from '@/components/ss/PathBar';
import type {
  Collaborator,
  CollaborationListItem,
  CollaboratorType,
  ContentExplorerInstance,
  FolderInfo,
  RoleType,
} from '@/types/ss';
import { useBoxExplorer } from '@/hooks/useBoxExplorer2';
import type { BoxFolder } from '@/types/BoxUiElements';

const buildPath = (folder: FolderInfo) => {
  if (folder.id === '0') {
    return { fullPath: DISPLAY_PATH_ROOT, relativePath: '' };
  }

  const entries = folder.pathCollection?.entries ?? [];
  const filteredEntries = entries.filter((entry) => entry.id !== '0');

  const segments: string[] = [];
  segments.push(...filteredEntries.map((entry) => entry.name));
  segments.push(folder.name);

  const fullPath = `${DISPLAY_PATH_ROOT}${segments.join('\\')}`;
  const relativePath = fullPath.slice(DISPLAY_PATH_ROOT.length);

  return { fullPath, relativePath };
};

const PathBarSkeleton = () => (
  <div className="flex items-center gap-3 w-full py-1">
    <div className="flex items-center gap-2 shrink-0">
      <Skeleton className="h-8 w-12 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <div className="relative flex-1 min-w-0">
      <Skeleton className="h-6 w-full max-w-75 rounded" />
    </div>
    <div className="flex items-center gap-1 shrink-0">
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="h-9 w-9 rounded-full" />
    </div>
  </div>
);

export function ExplorerRestoreSkeleton() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-background backdrop-blur-[1px]">
      <div className="h-17.5 border-b flex items-center p-4 justify-between">
        <Skeleton className="h-12 w-[70%] rounded-full" />
      </div>
      <div className="h-12.5 border-b flex items-center p-4 justify-between">
        <Skeleton className="h-5 w-[20%] rounded-full" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-1 items-center gap-4">
              <div className="flex items-center w-[30%] gap-4">
                <Skeleton className="size-10 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CollaborationPanelSkeleton() {
  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background py-6 space-y-3">
      <div className="px-4 space-y-3">
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <div className="p-4 space-y-3 border-b">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="flex justify-between">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div className="px-4 space-y-3 flex-1">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-50 w-full rounded-md" />
      </div>
    </div>
  );
}

const SSContent = ({
  rootFolderId,
  groupName,
}: {
  rootFolderId: string;
  groupName: string;
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isLogin = useSelector(userSelector.isLoginSelector());
  const userCd = useSelector(userSelector.loginUserCdSelector());
  const token = useSelector(boxSelector.tokenSelector());
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const collaborationByFolderId = useSelector(
    ssSelector.collaborationByFolderIdSelector()
  );
  const rememberedCurrentFolder = useSelector(
    ssSelector.currentFolderSelector(rootFolderId)
  );
  const savedFolderHistory = useSelector(
    ssSelector.folderHistorySelector(rootFolderId)
  );
  const savedHistoryIndex = useSelector(
    ssSelector.historyIndexSelector(rootFolderId)
  );
  const isLoading = useSelector(ssSelector.isLoadingSelector());

  const initialFolder = useMemo<FolderInfo>(
    () => ({
      id: rootFolderId,
      name: '',
      pathCollection: { entries: [] },
    }),
    [rootFolderId]
  );

  const initialHistory = useMemo(() => {
    let history = savedFolderHistory.filter(Boolean);
    if (history.length === 0 || history[0] !== rootFolderId) {
      history = [rootFolderId, ...history.filter((id) => id !== rootFolderId)];
    }
    return history;
  }, [rootFolderId, savedFolderHistory]);

  const restoreTargetId =
    rememberedCurrentFolder?.id !== rootFolderId
      ? rememberedCurrentFolder?.id
      : undefined;

  const {
    explorerRef,
    currentFolder,
    folderHistory,
    historyIndex,
    isRestoring,
    handleNavigate,
    executeNavigate,
  } = useBoxExplorer(
    rootFolderId,
    initialFolder,
    initialHistory,
    savedHistoryIndex,
    restoreTargetId
  );

  const [explorerInstance, setExplorerInstance] = useState<
    ContentExplorerInstance | undefined
  >(undefined);

  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);

  const handleGoBack = () =>
    executeNavigate(folderHistory[historyIndex - 1], historyIndex - 1);

  const handleGoForward = () =>
    executeNavigate(folderHistory[historyIndex + 1], historyIndex + 1);

  const { fullPath, relativePath } = useMemo(
    () => buildPath(currentFolder),
    [currentFolder]
  );

  const currentFolderName = currentFolder.name;

  // 継承のコラボレートについて、IDをもとに継承元のパス文字列を作成
  const getSourcePath = useCallback(
    (targetId: string) => {
      let currentPathString = DISPLAY_PATH_ROOT;
      const currentEntries =
        currentFolder.pathCollection?.entries.filter((e) => e.id !== '0') ?? [];

      const targetIdx = currentEntries.findIndex((entry) => entry.id === targetId);
      const targetEntries =
        targetIdx >= 0 ? currentEntries.slice(0, targetIdx + 1) : [];

      for (const entry of targetEntries) {
        const separator = currentPathString.endsWith('\\') ? '' : '\\';
        currentPathString += `${separator}${entry.name}`;
      }
      return currentPathString;
    },
    [currentFolder]
  );

  const currentCollaborationStatus = useSelector(
    ssSelector.collaborationStatusSelector(currentFolder.id)
  );
  const currentCollaborationRows: GetFolderCollaborationsResponse[] | undefined =
    collaborationByFolderId[currentFolder.id];

  // APIで取得したコラボレータを Collaborator 型に変換して詰め直す
  const collaborators = useMemo<CollaborationListItem[]>(() => {
    const rawRows = currentCollaborationRows ?? [];
    return rawRows
      .map((row): CollaborationListItem => {
        const sourceFolderId = row.item?.id ?? currentFolder.id;
        const isInherited = sourceFolderId !== currentFolder.id;
        const canEdit = row.can_view_path ?? row.canViewPath ?? true;
        const collaborator: Collaborator = {
          id: row.id,
          type: row.accessible_by?.type === 'group' ? 'department' : 'user',
          name: row.accessible_by?.name ?? '名称未設定',
          role: row.role,
          canEdit,
          sourceFolderId,
        };
        return {
          collaborator,
          isInherited,
          canRemove: canEdit,
          sourcePath: isInherited ? getSourcePath(sourceFolderId) : undefined,
        };
      })
      .sort((a, b) => {
        return (
          Number(b.collaborator.canEdit) - Number(a.collaborator.canEdit) ||
          Number(a.isInherited) - Number(b.isInherited) ||
          (a.collaborator.type < b.collaborator.type ? -1 : 1)
        );
      });
  }, [currentCollaborationRows, currentFolder.id, getSourcePath]);

  const isCollaboratorsListLoading =
    isRestoring ||
    (currentCollaborationRows === undefined &&
      (currentCollaborationStatus === 'idle' ||
        currentCollaborationStatus === 'loading'));

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  const fetchCollaborators = useCallback(async () => {
    await dispatch(getFolderCollaborations(currentFolder.id)).unwrap();
  }, [dispatch, currentFolder.id]);

  useEffect(() => {
    if (!isRestoring) {
      fetchCollaborators().catch(() => {
        toast.error('コラボレータの取得に失敗しました');
      });
    }
  }, [isRestoring, fetchCollaborators]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (explorerInstance) return;
    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;
    const explorer = new BoxGlobal.ContentExplorer();
    setExplorerInstance(explorer);
    explorerRef.current = explorer;
  }, [explorerInstance, explorerRef]);

  useEffect(() => {
    if (!explorerInstance || !isLogin || !token) return;
    explorerInstance.show(rootFolderId, token.accessToken, {
      container: '.box-container',
      canPreview: false,
      size: 'large',
    });
  }, [explorerInstance, rootFolderId, token, isLogin]);

  useEffect(() => {
    if (!explorerInstance) return;
    const listener = (item: BoxFolder) => handleNavigate(item);
    explorerInstance.removeAllListeners?.();
    explorerInstance.addListener?.('navigate', listener);
    return () => {
      explorerInstance.removeAllListeners?.();
    };
  }, [explorerInstance, handleNavigate]);

  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullPath);
      toast.success('パスをコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  }, [fullPath]);

  const handleOpenBox = useCallback(() => {
    window.open(`https://app.box.com/folder/${currentFolder.id}`, '_blank');
  }, [currentFolder.id]);

  const handleOpenExplorer = useCallback(() => {
    const boxDriveRoot = `C:\\Users\\${userCd}\\Box`;
    const entrySegments =
      currentFolder.pathCollection?.entries
        .filter((e) => e.id !== '0')
        .map((entry) => entry.name) ?? [];

    const localPath = [boxDriveRoot, ...entrySegments, currentFolder.name].join('\\');
    const uri = `isexplorer:${encodeURIComponent(localPath)}`;
    window.open(uri, '_blank');
  }, [userCd, currentFolder]);

  const handleBackToShareArea = useCallback(() => {
    dispatch(ssActions.clearCurrentFolder(rootFolderId));
    dispatch(ssActions.clearFolderHistory(rootFolderId));
    navigate(UrlPath.ShareArea);
  }, [dispatch, navigate, rootFolderId]);

  const handleAddCollaborator = useCallback(async () => {
    if (!selectedCollaborator) return;

    const isGroup = groups.some((g) => g.value === selectedCollaborator.value);
    const collaboratorType: CollaboratorType = isGroup ? 'department' : 'user';
    const accessibleByType = collaboratorType === 'department' ? 'group' : 'user';

    const existingRows = collaborationByFolderId[currentFolder.id] ?? [];
    const alreadyExists = existingRows.some(
      (row) =>
        row.accessible_by?.id === selectedCollaborator.value &&
        row.accessible_by?.type === accessibleByType
    );

    if (alreadyExists) {
      toast.error('既にコラボレートされています');
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
      await dispatch(createCollaboration(params)).unwrap();
      toast.success('コラボレートしました');
      resetForm();
      void fetchCollaborators().catch(() => {
        toast.error('コラボレータの取得に失敗しました');
      });
    } catch (error) {
      toast.error(
        typeof error === 'string' ? error : 'コラボレートに失敗しました'
      );
    }
  }, [
    selectedCollaborator,
    groups,
    currentFolder.id,
    collaborationByFolderId,
    selectedRole,
    dispatch,
    resetForm,
    fetchCollaborators,
  ]);

  const handleRemoveCollaborator = useCallback(
    async (collaborator: Collaborator) => {
      try {
        await dispatch(
          deleteCollaboration({ collaborationId: collaborator.id })
        ).unwrap();
        toast.success('コラボレータを削除しました');
        void fetchCollaborators().catch(() => {
          toast.error('コラボレータの取得に失敗しました');
        });
      } catch (error) {
        toast.error(
          typeof error === 'string' ? error : 'コラボレータの削除に失敗しました'
        );
      }
    },
    [dispatch, fetchCollaborators]
  );

  const handleUpdateCollaboratorRole = useCallback(
    async (collaborator: Collaborator, role: RoleType) => {
      try {
        await dispatch(
          updateCollaboration({
            collaborationId: collaborator.id,
            params: { role },
          })
        ).unwrap();
        toast.success('コラボレータのロールを変更しました');
        void fetchCollaborators().catch(() => {
          toast.error('コラボレータの取得に失敗しました');
        });
      } catch (error) {
        toast.error(
          typeof error === 'string'
            ? error
            : 'コラボレータのロール更新に失敗しました'
        );
      }
    },
    [dispatch, fetchCollaborators]
  );

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < folderHistory.length - 1;

  // handleBackToShareArea は将来的にUI（例: PathBar の「一覧へ戻る」ボタン）に接続する想定
  void handleBackToShareArea;

  return (
    <Layout hideTabs fluid subtitle={groupName}>
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

        <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch">
          <div className="flex flex-col min-w-0 lg:min-h-0 lg:flex-1 max-h-[calc(100dvh-140px)]">
            <Card className="relative flex flex-1 flex-col overflow-hidden py-0">
              <div className="flex-1 min-h-96 lg:min-h-0 lg:h-full">
                {token ? (
                  <div className="box-container h-full [&_.be-logo]:hidden [&_.be-logo-container]:hidden [&_.be-header]:pl-3" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Boxに接続中...
                  </div>
                )}
                {isRestoring && <ExplorerRestoreSkeleton />}
              </div>
            </Card>
          </div>

          <div className="flex flex-col lg:h-fit lg:min-h-0 lg:w-96 max-h-[calc(100dvh-140px)]">
            {isRestoring ? (
              <CollaborationPanelSkeleton />
            ) : (
              <CollaborationPanel
                className="flex-1"
                folderName={currentFolderName}
                collaborators={collaborators}
                isListLoading={isCollaboratorsListLoading}
                isBusy={isLoading}
                selectedCollaborator={selectedCollaborator}
                selectedRole={selectedRole}
                onSelectedCollaboratorChange={setSelectedCollaborator}
                onSelectedRoleChange={setSelectedRole}
                onAddCollaborator={handleAddCollaborator}
                onRemoveCollaborator={handleRemoveCollaborator}
                onUpdateCollaboratorRole={handleUpdateCollaboratorRole}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const SS = () => {
  const { folderId: routeFolderId } = useParams();
  const area = useSelector(shareSelector.areaSelector());
  const areaIdList = area.map((a) => a.box_folder_id).filter((a) => a !== '');

  if (!routeFolderId || !areaIdList.includes(routeFolderId)) {
    return <Navigate to={UrlPath.ShareArea} replace />;
  }

  const groupName = area.find((a) => a.box_folder_id === routeFolderId)!.group_name;

  return (
    <SSContent
      key={routeFolderId}
      rootFolderId={routeFolderId}
      groupName={groupName}
    />
  );
};
