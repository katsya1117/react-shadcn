import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";

import type { AutoCompleteData } from "@/api";
import type { BoxFolder } from "@/@types/BoxUiElements";
import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { autoCompleteSelector } from "@/redux/slices/autoCompleteSlice";
import { boxSelector } from "@/redux/slices/userSlice";
import { CollaborationPanel } from "@/components/ss/CollaborationPanel";
import { DEFAULT_ROLE } from "@/components/ss/constants";
import { PathBar } from "@/components/ss/PathBar";
import type {
  CollaborationListItem,
  CollaborationState,
  Collaborator,
  CollaboratorType,
  ContentExplorerInstance,
  FolderInfo,
  RoleType,
} from "@/components/ss/types";

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
  const rootFolderId =
    routeFolderId && /^\d+$/.test(routeFolderId) ? routeFolderId : "0";
  const explorerRef = useRef<ContentExplorerInstance | null>(null);

  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;
  const users = useSelector(autoCompleteSelector.usersSelector());
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const devToken = useMemo(() => {
    if (typeof window === "undefined") return undefined;

    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("devToken")?.trim();
    if (queryToken) return queryToken;

    const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
    return storedToken && storedToken.length > 0 ? storedToken : undefined;
  }, []);
  const accessToken = devToken ?? token;
  const emptyFolder = useMemo<FolderInfo>(
    () => ({
      id: rootFolderId,
      name: rootFolderId === "0" ? "All Files" : "",
      pathCollection: { entries: [] },
    }),
    [rootFolderId],
  );
  const rootDefaultCollaborators = useMemo<Collaborator[]>(
    () => [
      {
        id: `${rootFolderId}:department:tokyo`,
        type: "department",
        name: "東京センター",
        role: "editor",
        canViewPath: true,
        sourceFolderId: rootFolderId,
      },
      {
        id: `${rootFolderId}:user:sre`,
        type: "user",
        name: "sre-user",
        role: "viewer",
        canViewPath: true,
        sourceFolderId: rootFolderId,
      },
      {
        id: `${rootFolderId}:user:legacy`,
        type: "user",
        name: "legacy-user",
        role: "viewer",
        canViewPath: false,
        sourceFolderId: rootFolderId,
      },
    ],
    [rootFolderId],
  );

  const [selectedFolder, setSelectedFolder] = useState<FolderInfo>(emptyFolder);
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);
  const [isSavingCollaborator, setIsSavingCollaborator] = useState(false);
  const [collaborationsByFolderId, setCollaborationsByFolderId] = useState<
    Record<string, CollaborationState>
  >({});

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
  const layoutSubtitle = useMemo(() => {
    if (rootFolderId === "0") return undefined;
    if (selectedFolder.id === rootFolderId && selectedFolder.name) {
      return selectedFolder.name;
    }

    return selectedFolder.pathCollection?.entries?.find(
      (entry) => entry.id === rootFolderId,
    )?.name;
  }, [rootFolderId, selectedFolder.id, selectedFolder.name, selectedFolder.pathCollection]);
  const collaborators = useMemo<CollaborationListItem[]>(
    () => {
      const getDirectForFolder = (folderId: string) =>
        collaborationsByFolderId[folderId]?.direct ??
        (folderId === rootFolderId ? rootDefaultCollaborators : []);

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
        selectedFolder.pathCollection?.entries?.filter((entry) => entry.id !== "0") ??
        [];
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
    },
    [collaborationsByFolderId, rootDefaultCollaborators, rootFolderId, selectedFolder],
  );

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  useEffect(() => {
    setSelectedFolder(emptyFolder);
    resetForm();
  }, [emptyFolder, resetForm]);

  const handleNavigate = useCallback(
    (payload: unknown) => {
      const folder = extractFolderFromEvent(payload);
      if (!folder || folder.type !== "folder") return;

      setSelectedFolder({
        id: folder.id,
        name: folder.name ?? "",
        pathCollection: folder.path_collection
          ? { entries: folder.path_collection.entries || [] }
          : undefined,
      });
      resetForm();
    },
    [resetForm],
  );

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
      id: `${selectedFolder.id}:${collaboratorType}:${selectedCollaborator.value}`,
      type: collaboratorType,
      name: selectedCollaborator.label,
      role: selectedRole,
      canViewPath: true,
      sourceFolderId: selectedFolder.id,
    };

    const currentDirectCollaborators =
      collaborationsByFolderId[selectedFolder.id]?.direct ??
      (selectedFolder.id === rootFolderId ? rootDefaultCollaborators : []);
    const alreadyExists = currentDirectCollaborators.some(
      (collaborator) =>
        collaborator.type === nextCollaborator.type &&
        collaborator.name === nextCollaborator.name,
    );

    if (alreadyExists) {
      toast.error("同じコラボレーターは既に設定されています");
      return;
    }

    setIsSavingCollaborator(true);

    try {
      setCollaborationsByFolderId((prev) => {
        const currentDirect =
          prev[selectedFolder.id]?.direct ??
          (selectedFolder.id === rootFolderId ? rootDefaultCollaborators : []);
        return {
          ...prev,
          [selectedFolder.id]: {
            direct: [...currentDirect, nextCollaborator],
          },
        };
      });
      toast.success(`${nextCollaborator.name} を追加しました`);
      setSelectedCollaborator(null);
    } catch {
      toast.error("コラボレーターの追加に失敗しました");
    } finally {
      setIsSavingCollaborator(false);
    }
  }, [
    collaborationsByFolderId,
    groups,
    rootFolderId,
    rootDefaultCollaborators,
    selectedCollaborator,
    selectedFolder.id,
    selectedRole,
    users,
  ]);

  const handleRemoveCollaborator = useCallback(
    async (collaborator: Collaborator) => {
      setIsSavingCollaborator(true);

      try {
        setCollaborationsByFolderId((prev) => {
          const currentDirect =
            prev[selectedFolder.id]?.direct ??
            (selectedFolder.id === rootFolderId ? rootDefaultCollaborators : []);
          return {
            ...prev,
            [selectedFolder.id]: {
              direct: currentDirect.filter((item) => item.id !== collaborator.id),
            },
          };
        });
        toast.success(`${collaborator.name} を削除しました`);
      } catch {
        toast.error("コラボレーターの削除に失敗しました");
      } finally {
        setIsSavingCollaborator(false);
      }
    },
    [rootDefaultCollaborators, rootFolderId, selectedFolder.id],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <Layout hideTabs fluid subtitle={layoutSubtitle}>
        <BoxManager />

        <div className="flex min-h-0 flex-1 flex-col gap-4 pb-4">
          <div className="space-y-1">
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

          <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row xl:items-stretch">
            <div className="flex min-h-0 min-w-0 flex-col xl:flex-1">
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

            <div className="flex min-h-0 flex-col xl:w-80 xl:shrink-0">
              <CollaborationPanel
                folderName={selectedFolderName}
                collaborators={collaborators}
                isBusy={isSavingCollaborator}
                selectedCollaborator={selectedCollaborator}
                selectedRole={selectedRole}
                onSelectedCollaboratorChange={setSelectedCollaborator}
                onSelectedRoleChange={setSelectedRole}
                onAddCollaborator={handleAddCollaborator}
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
