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

import type {
  AutoCompleteData,
  GetFolderCollaborationsResponse,
} from "@/api";
import type { BoxFolder } from "@/@types/BoxUiElements";
import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { autoCompleteSelector } from "@/redux/slices/autoCompleteSlice";
import { uiActions } from "@/redux/slices/uiSlice";
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
const SHARE_AREA_ROUTE_FOLDER_ID_SET = new Set(
  SHARE_AREAS.map((area) => area.boxFolderId),
);

const isShareAreaRouteFolderId = (
  folderId: string | null | undefined,
): folderId is string =>
  typeof folderId === "string" && SHARE_AREA_ROUTE_FOLDER_ID_SET.has(folderId);

const stripCurrentFolderIdFromSearch = (search: string): string => {
  const params = new URLSearchParams(search);
  params.delete("currentFolderId");

  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : "";
};

const toFolderInfo = (folder: BoxFolder): FolderInfo => {
  return {
    id: folder.id,
    name: folder.name ?? "",
    pathCollection: folder.pathCollection
      ? {
          entries: folder.pathCollection.map((entry) => ({
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
  const descendantEntries = rootIndex >= 0 ? filteredEntries.slice(rootIndex + 1) : [];
  const segments = [ROOT_SHARE_PATH];
  const rootName =
    rootIndex >= 0
      ? filteredEntries[rootIndex]?.name
      : folder.id === rootFolderId
        ? folder.name
        : undefined;

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
  const sourceFolderId = item.item?.id ?? currentFolderId;
  const isInherited = sourceFolderId !== currentFolderId;
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
    canRemove: !isInherited && canEdit,
    sourcePath: isInherited ? sourcePathByFolderId[sourceFolderId] : undefined,
  };
};

type SSContentProps = {
  rootFolderId: string;
};

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
  const rootFolderPath = generatePath(UrlPath.SS, { folderId: rootFolderId });

  const [currentFolder, setCurrentFolder] =
    useState<FolderInfo>(initialFolder);
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);

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
    const visibleEntries =
      (() => {
        const rootIndex = pathEntries.findIndex(
          (entry) => entry.id === rootFolderId,
        );
        return rootIndex >= 0 ? pathEntries.slice(rootIndex) : [];
      })();
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
  const collaborators = useMemo<CollaborationListItem[]>(() => {
    const rows = collaborationsByFolderId[currentFolder.id] ?? [];

    return rows.map((item) =>
      toCollaborationListItem(item, currentFolder.id, sourcePathByFolderId),
    );
  }, [collaborationsByFolderId, currentFolder.id, sourcePathByFolderId]);

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  const refreshCollaborations = useCallback(async () => {
    await dispatch(getFolderCollaborations(currentFolder.id)).unwrap();
  }, [currentFolder.id, dispatch]);

  useEffect(() => {
    if (!location.search.includes("currentFolderId")) return;

    const nextSearch = stripCurrentFolderIdFromSearch(location.search);
    navigate(`${rootFolderPath}${nextSearch}`, { replace: true });
  }, [location.search, navigate, rootFolderPath]);

  const handleNavigate = useCallback(
    (payload: BoxFolder) => {
      const nextFolder = toFolderInfo(payload);
      setCurrentFolder(nextFolder);
      dispatch(
        ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }),
      );
      dispatch(
        uiActions.setLastVisited({
          key: UrlPath.ShareArea,
          path: rootFolderPath,
        }),
      );
      resetForm();
    },
    [dispatch, resetForm, rootFolderId, rootFolderPath],
  );

  useEffect(() => {
    void refreshCollaborations().catch(() => {
      toast.error("コラボレーター一覧の取得に失敗しました");
    });
  }, [refreshCollaborations]);

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

    try {
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
      await refreshCollaborations();
      toast.success(`${nextCollaborator.name} を追加しました`);
      setSelectedCollaborator(null);
    } catch {
      toast.error("追加は完了しましたが一覧の更新に失敗しました");
    }
  }, [
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

  const handleBackToShareArea = useCallback(() => {
    dispatch(ssActions.clearCurrentFolder(rootFolderId));
    dispatch(
      uiActions.setLastVisited({
        key: UrlPath.ShareArea,
        path: UrlPath.ShareArea,
      }),
    );
    navigate(UrlPath.ShareArea);
  }, [dispatch, navigate, rootFolderId]);

  return (
    <TooltipProvider delayDuration={100}>
      <Layout hideTabs fluid subtitle={layoutSubtitle}>
        <BoxManager />

        <div className="flex min-h-0 flex-1 flex-col gap-4 pb-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="mb-1 h-8 px-2 text-muted-foreground"
              onClick={handleBackToShareArea}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              センター専用領域に戻る
            </Button>
            <p className="text-sm text-muted-foreground">センター専用領域</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              共有領域管理
            </h1>
          </div>

          <PathBar
            folderName={currentFolderName}
            relativePath={currentFolderRelativePath}
            onCopyPath={handleCopyPath}
            onOpenBox={handleOpenBox}
            onOpenExplorer={handleOpenExplorer}
          />

          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="flex min-h-0 min-w-0 flex-col lg:flex-1">
              <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
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
              </Card>
            </div>

            <div className="flex min-h-0 flex-col lg:w-96 lg:shrink-0 lg:self-stretch">
              <CollaborationPanel
                folderName={currentFolderName}
                collaborators={collaborators}
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
  const { folderId: routeFolderId } = useParams();

  if (!isShareAreaRouteFolderId(routeFolderId)) {
    return <Navigate replace to={UrlPath.ShareArea} />;
  }

  return <SSContent key={routeFolderId} rootFolderId={routeFolderId} />;
};

export default SS;
