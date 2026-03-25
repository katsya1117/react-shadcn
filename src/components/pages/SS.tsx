import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generatePath,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";
import { ArrowLeft } from "lucide-react";

import type { AutoCompleteData } from "@/api";
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

const ROOT_SHARE_PATH = "\\\\tggfile.jp\\share";

const sanitizePathName = (id: string, name?: string | null) => {
  if (id === "0" || name === "すべてのファイル") return "share";
  return name || "root";
};

const extractFolderFromEvent = (payload: unknown): BoxFolder | null => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const folder = extractFolderFromEvent(item);
      if (folder) return folder;
    }
    return null;
  }

  if (typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  if (record.type === "folder" && typeof record.id === "string") {
    return payload as BoxFolder;
  }

  return (
    extractFolderFromEvent(record.item) ||
    extractFolderFromEvent(record.items) ||
    extractFolderFromEvent(record.selected) ||
    extractFolderFromEvent(record.selection)
  );
};

const toFolderInfo = (folder: BoxFolder): FolderInfo => {
  const folderWithPath = folder as {
    id: string;
    name?: string | null;
    path_collection?: { entries?: { id: string; name: string }[] };
  };

  return {
    id: folderWithPath.id,
    name: folderWithPath.name ?? "",
    pathCollection: folderWithPath.path_collection
      ? { entries: folderWithPath.path_collection.entries ?? [] }
      : undefined,
  };
};

const buildSharePath = (folder: FolderInfo, rootFolderId: string): string => {
  if (folder.id === "0") {
    return ROOT_SHARE_PATH;
  }

  const entries = folder.pathCollection?.entries ?? [];
  const filteredEntries = entries.filter((entry) => entry.id !== "0");
  const rootIndex = filteredEntries.findIndex(
    (entry) => entry.id === rootFolderId,
  );
  const descendantEntries =
    rootIndex >= 0 ? filteredEntries.slice(rootIndex + 1) : filteredEntries;
  const segments = ["share"];

  if (rootFolderId !== "0") {
    const rootName =
      rootIndex >= 0
        ? filteredEntries[rootIndex]?.name
        : folder.id === rootFolderId
          ? folder.name
          : undefined;

    if (rootName) {
      segments.push(sanitizePathName(rootFolderId, rootName));
    }
  }

  segments.push(
    ...descendantEntries.map((entry) => sanitizePathName(entry.id, entry.name)),
  );

  if (folder.id !== rootFolderId && folder.name) {
    segments.push(sanitizePathName(folder.id, folder.name));
  }

  return `\\\\tggfile.jp${segments.map((segment) => `\\${segment}`).join("")}`;
};

export const SS = () => {
  const { folderId: routeFolderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const rootFolderId =
    routeFolderId && /^\d+$/.test(routeFolderId) ? routeFolderId : "0";
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
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const queryCurrentFolderId = searchParams.get("currentFolderId")?.trim();
  const restoredCurrentFolderId =
    queryCurrentFolderId && /^\d+$/.test(queryCurrentFolderId)
      ? queryCurrentFolderId
      : rootFolderId;
  const explorerStartFolderId = restoredCurrentFolderId;

  const emptyFolder = useMemo<FolderInfo>(
    () => ({
      id: rememberedCurrentFolder?.id ?? explorerStartFolderId,
      name:
        (rememberedCurrentFolder?.id ?? explorerStartFolderId) ===
          rootFolderId && rootFolderId === "0"
          ? "All Files"
          : (rememberedCurrentFolder?.name ?? ""),
      pathCollection: rememberedCurrentFolder?.pathCollection ?? {
        entries: [],
      },
    }),
    [explorerStartFolderId, rememberedCurrentFolder, rootFolderId],
  );
  const rootFolderPath = generatePath(UrlPath.SS, { folderId: rootFolderId });

  const [selectedFolder, setSelectedFolder] = useState<FolderInfo>(
    rememberedCurrentFolder ?? emptyFolder,
  );
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);

  const { selectedFolderPath, selectedFolderRelativePath } = useMemo(() => {
    const fullPath = buildSharePath(selectedFolder, rootFolderId);
    const relativePath =
      fullPath === ROOT_SHARE_PATH
        ? ""
        : fullPath.startsWith(`${ROOT_SHARE_PATH}\\`)
          ? fullPath.slice(`${ROOT_SHARE_PATH}\\`.length)
          : fullPath;

    return {
      selectedFolderPath: fullPath,
      selectedFolderRelativePath: relativePath,
    };
  }, [selectedFolder, rootFolderId]);
  const selectedFolderName = selectedFolder.name || "対象フォルダ";
  const selectedFolderPathIds = useMemo(
    () =>
      selectedFolder.pathCollection?.entries
        ?.map((entry) => entry.id)
        .join(",") ?? "",
    [selectedFolder.pathCollection],
  );
  const layoutSubtitle = useMemo(() => {
    if (rootFolderId === "0") return undefined;
    if (selectedFolder.id === rootFolderId && selectedFolder.name) {
      return selectedFolder.name;
    }

    return selectedFolder.pathCollection?.entries?.find(
      (entry) => entry.id === rootFolderId,
    )?.name;
  }, [
    rootFolderId,
    selectedFolder.id,
    selectedFolder.name,
    selectedFolder.pathCollection,
  ]);
  const collaborators = useMemo<CollaborationListItem[]>(() => {
    const getDirectForFolder = (folderId: string) =>
      collaborationsByFolderId[folderId] ?? [];

    // sourceFolderId が現在フォルダと同じものを direct として扱う
    const directItems = getDirectForFolder(selectedFolder.id).map(
      (collaborator) => ({
        collaborator,
        isInherited: false,
        canRemove:
          collaborator.canViewPath &&
          collaborator.sourceFolderId === selectedFolder.id,
      }),
    );

    const pathEntries =
      selectedFolder.pathCollection?.entries?.filter(
        (entry) => entry.id !== "0",
      ) ?? [];
    const visibleEntries =
      rootFolderId === "0"
        ? pathEntries
        : (() => {
            const rootIndex = pathEntries.findIndex(
              (entry) => entry.id === rootFolderId,
            );
            return rootIndex >= 0 ? pathEntries.slice(rootIndex) : [];
          })();

    const inheritedItems: CollaborationListItem[] = [];
    const pathMap: Record<string, string> = {};
    const segments = ["share"];

    for (const entry of visibleEntries) {
      segments.push(sanitizePathName(entry.id, entry.name));
      pathMap[entry.id] = segments.join("\\");
    }

    for (const entry of visibleEntries) {
      if (entry.id === selectedFolder.id) continue;

      // 祖先フォルダの direct を、表示上は inherited として混ぜる
      for (const collaborator of getDirectForFolder(entry.id)) {
        inheritedItems.push({
          collaborator,
          isInherited: true,
          canRemove: false,
          sourcePath: pathMap[entry.id],
        });
      }
    }

    return [...directItems, ...inheritedItems];
  }, [collaborationsByFolderId, rootFolderId, selectedFolder]);

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  useEffect(() => {
    setSelectedFolder(rememberedCurrentFolder ?? emptyFolder);
    resetForm();
  }, [emptyFolder, rememberedCurrentFolder, resetForm]);

  const handleNavigate = useCallback(
    (payload: unknown) => {
      const folder = extractFolderFromEvent(payload);
      if (!folder || folder.type !== "folder") return;

      const nextFolder = toFolderInfo(folder);

      setSelectedFolder(nextFolder);
      dispatch(
        ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }),
      );
      dispatch(
        uiActions.setLastVisited({
          key: UrlPath.ShareArea,
          path:
            nextFolder.id === rootFolderId
              ? rootFolderPath
              : `${rootFolderPath}?currentFolderId=${nextFolder.id}`,
        }),
      );
      resetForm();
    },
    [dispatch, resetForm, rootFolderId, rootFolderPath],
  );

  useEffect(() => {
    const ancestorFolderIds =
      selectedFolder.pathCollection?.entries
        ?.filter((entry) => entry.id !== "0" && entry.id !== selectedFolder.id)
        .map((entry) => entry.id) ?? [];
    const folderIds = Array.from(
      new Set([selectedFolder.id, ...ancestorFolderIds]),
    );

    folderIds.forEach((folderId) => {
      void dispatch(getFolderCollaborations(folderId));
    });
  }, [dispatch, selectedFolder.id, selectedFolderPathIds]);

  const handleOpenBox = useCallback(() => {
    window.open(
      `https://app.box.com/folder/${selectedFolder.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [selectedFolder.id]);

  const handleOpenExplorer = useCallback(() => {
    const fileUrl = `file://${selectedFolderPath.replace(/\\/g, "/")}`;
    window.open(fileUrl, "_blank");
    toast.info("エクスプローラーで開きます");
  }, [selectedFolderPath]);

  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(selectedFolderPath);
      toast.success("パスをコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  }, [selectedFolderPath]);

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
    explorer.show(explorerStartFolderId, accessToken, {
      container: "#box-content-explorer",
      canPreview: false,
      size: "large",
    });

    return () => {
      explorer.removeAllListeners?.();
      explorer.hide?.();
    };
  }, [accessToken, explorerStartFolderId, handleNavigate]);

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
      id: `${selectedFolder.id}:${collaboratorType}:${selectedCollaborator.value}`,
      type: collaboratorType,
      name: selectedCollaborator.label,
      role: selectedRole,
      canViewPath: true,
      sourceFolderId: selectedFolder.id,
    };

    try {
      await dispatch(
        createCollaborations({
          folderId: selectedFolder.id,
          collaboratorId: selectedCollaborator.value,
          collaboratorType,
          collaboratorName: nextCollaborator.name,
          role: selectedRole,
          canViewPath: true,
        }),
      ).unwrap();
      toast.success(`${nextCollaborator.name} を追加しました`);
      setSelectedCollaborator(null);
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "コラボレーターの追加に失敗しました",
      );
    }
  }, [
    dispatch,
    groups,
    selectedCollaborator,
    selectedFolder.id,
    selectedRole,
    users,
  ]);

  const handleRemoveCollaborator = useCallback(
    async (collaborator: Collaborator) => {
      try {
        await dispatch(
          deleteCollaborations({
            folderId: selectedFolder.id,
            collaborationId: collaborator.id,
          }),
        ).unwrap();
        toast.success(`${collaborator.name} を削除しました`);
      } catch {
        toast.error("コラボレーターの削除に失敗しました");
      }
    },
    [dispatch, selectedFolder.id],
  );

  const handleUpdateCollaboratorRole = useCallback(
    async (collaborator: Collaborator, role: RoleType) => {
      try {
        await dispatch(
          updateCollaborations({
            folderId: selectedFolder.id,
            collaborationId: collaborator.id,
            params: { role },
          }),
        ).unwrap();
        toast.success(`${collaborator.name} のロールを更新しました`);
      } catch (error) {
        toast.error(
          typeof error === "string"
            ? error
            : "コラボレーターのロール更新に失敗しました",
        );
      }
    },
    [dispatch, selectedFolder.id],
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
            folderName={selectedFolderName}
            relativePath={selectedFolderRelativePath}
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
                folderName={selectedFolderName}
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

export default SS;
