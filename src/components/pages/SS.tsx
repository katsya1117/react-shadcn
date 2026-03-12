import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";

import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { AutoCompleteSingle } from "@/components/parts/AutoComplete/AutoCompleteSingle";
import { boxSelector } from "@/redux/slices/userSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Copy,
  ExternalLink,
  FolderOpen,
  Settings,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

import type { AutoCompleteData } from "@/api";
import type { BoxFolder } from "@/@types/BoxUiElements";
import { cn } from "@/lib/utils";

type ContentExplorerInstance = {
  show: (folderId: string, token: string, opts: unknown) => void;
  hide?: () => void;
  removeAllListeners?: () => void;
  addListener?: (event: string, callback: (item: BoxFolder) => void) => void;
};

type RoleType = "editor" | "viewer";

const ROLE_OPTIONS: { value: RoleType; label: string; description: string }[] =
  [
    { value: "editor", label: "Editor", description: "編集可能" },
    { value: "viewer", label: "Viewer", description: "閲覧のみ" },
  ];

type CollaboratorType = "user" | "department";

type Collaborator = {
  id: string;
  type: CollaboratorType;
  name: string;
  role: RoleType;
  color?: string;
};

const MOCK_COLLABORATORS: Collaborator[] = [
  {
    id: "1",
    type: "department",
    name: "東京センター",
    role: "editor",
    color: "#6366f1",
  },
  {
    id: "2",
    type: "user",
    name: "sre-user",
    role: "viewer",
    color: "#2563eb",
  },
  {
    id: "3",
    type: "department",
    name: "大阪DR",
    role: "viewer",
    color: "#ef4444",
  },
];

type CurrentFolderInfo = {
  id: string;
  name: string;
  pathCollection?: { entries: { id: string; name: string }[] };
};

const sanitizePathName = (id: string, name?: string | null) => {
  if (id === "0" || name === "すべてのファイル") return "share";
  return name || "root";
};

const getInitialFolderInfo = (folderId: string): CurrentFolderInfo => ({
  id: folderId,
  name: folderId === "0" ? "All Files" : "",
  pathCollection: { entries: [] },
});

const buildCollaborator = (
  type: CollaboratorType,
  target: AutoCompleteData,
  role: RoleType,
): Collaborator => ({
  id: `${type}:${target.value}`,
  type,
  name: target.label,
  role,
  color: target.color,
});

export const SS = () => {
  const { folderId: routeFolderId } = useParams();
  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;

  const devToken = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const paramToken = params.get("devToken")?.trim();
    if (paramToken) return paramToken;
    const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
    return storedToken && storedToken.length > 0 ? storedToken : undefined;
  }, []);

  const effectiveToken = devToken ?? token;
  const isNumeric = /^\d+$/.test(routeFolderId || "");
  const effectiveFolderId = isNumeric ? routeFolderId! : "0";

  const explorerRef = useRef<ContentExplorerInstance | null>(null);

  const [currentFolder, setCurrentFolder] = useState<CurrentFolderInfo>(
    getInitialFolderInfo(effectiveFolderId),
  );
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [targetFolder, setTargetFolder] = useState<CurrentFolderInfo | null>(
    null,
  );
  const [collaboratorsByFolder, setCollaboratorsByFolder] = useState<
    Record<string, Collaborator[]>
  >({});
  const [addType, setAddType] = useState<CollaboratorType>("department");
  const [selectedUser, setSelectedUser] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>("viewer");
  const [isMutatingCollaboration, setIsMutatingCollaboration] =
    useState(false);

  const canShowExplorer = Boolean(effectiveToken);

  useEffect(() => {
    setCurrentFolder(getInitialFolderInfo(effectiveFolderId));
    setTargetFolder(null);
    setIsPermissionDialogOpen(false);
  }, [effectiveFolderId]);

  const breadcrumbLabel = useMemo(() => {
    if (!currentFolder.name || currentFolder.id === "0") return "All Files";
    return `All Files > ${currentFolder.name}`;
  }, [currentFolder]);

  const currentPath = useMemo(() => {
    if (currentFolder.id === "0") {
      return "\\\\tggfile.jp\\share";
    }

    const basePath = "\\\\tggfile.jp";
    const entries = currentFolder.pathCollection?.entries ?? [];
    const filtered = entries.filter((entry) => entry.id !== "0");
    const rootIndex = filtered.findIndex((entry) => entry.id === effectiveFolderId);
    const afterRoot =
      rootIndex >= 0 ? filtered.slice(rootIndex + 1) : filtered;

    const segments = ["share"];

    if (currentFolder.name) {
      const rootName =
        rootIndex >= 0
          ? filtered[rootIndex]?.name ?? currentFolder.name
          : currentFolder.id === effectiveFolderId
            ? currentFolder.name
            : undefined;

      if (rootName) {
        segments.push(sanitizePathName(effectiveFolderId, rootName));
      }
    }

    segments.push(
      ...afterRoot.map((entry) => sanitizePathName(entry.id, entry.name)),
    );

    if (currentFolder.id !== effectiveFolderId && currentFolder.name) {
      segments.push(sanitizePathName(currentFolder.id, currentFolder.name));
    }

    const pathString = segments.map((segment) => `\\${segment}`).join("");
    return `${basePath}${pathString}`;
  }, [currentFolder, effectiveFolderId]);

  const boxWebUrl = useMemo(
    () => `https://app.box.com/folder/${currentFolder.id}`,
    [currentFolder.id],
  );

  const dialogCollaborators = useMemo(() => {
    if (!targetFolder) return [];
    return collaboratorsByFolder[targetFolder.id] ?? MOCK_COLLABORATORS;
  }, [collaboratorsByFolder, targetFolder]);

  const resetCollaborationForm = useCallback(() => {
    setSelectedUser(null);
    setSelectedDepartment(null);
    setSelectedRole("viewer");
    setAddType("department");
  }, []);

  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentPath);
      toast.success("パスをコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  }, [currentPath]);

  const handleOpenBox = useCallback(() => {
    window.open(boxWebUrl, "_blank", "noopener,noreferrer");
  }, [boxWebUrl]);

  const handleOpenExplorer = useCallback(() => {
    const fileUrl = `file://${currentPath.replace(/\\/g, "/")}`;
    window.open(fileUrl, "_blank");
    toast.info("エクスプローラーで開きます");
  }, [currentPath]);

  const handleMount = useCallback((item: BoxFolder) => {
    if (item.type !== "folder") return;

    const baseSegments = ["isexplorer:C:", "Users", "xxxx.xxxx", "Box"];
    const entrySegments =
      item.path_collection?.entries
        ?.filter((entry) => entry.id !== "0")
        .map((entry) => entry.name) ?? [];

    const target = encodeURI(
      [...baseSegments, ...entrySegments, item.name].join("\\"),
    );

    window.location.assign(target);
  }, []);

  const handleOpenPermissionDialog = useCallback(
    (item: BoxFolder) => {
      if (item.type !== "folder") return;

      setTargetFolder({
        id: item.id,
        name: item.name ?? "",
        pathCollection: item.path_collection
          ? { entries: item.path_collection.entries || [] }
          : undefined,
      });
      resetCollaborationForm();
      setIsPermissionDialogOpen(true);
    },
    [resetCollaborationForm],
  );

  const handleClosePermissionDialog = useCallback(() => {
    setIsPermissionDialogOpen(false);
    setTargetFolder(null);
    resetCollaborationForm();
  }, [resetCollaborationForm]);

  const customActions = useMemo(
    () => [
      {
        label: "マウント",
        onAction: (item: BoxFolder) => handleMount(item),
        type: "folder",
      },
      {
        label: "権限設定",
        onAction: (item: BoxFolder) => handleOpenPermissionDialog(item),
        type: "folder",
      },
    ],
    [handleMount, handleOpenPermissionDialog],
  );

  const handleNavigate = useCallback((item: BoxFolder) => {
    if (item.type !== "folder") return;

    setCurrentFolder({
      id: item.id,
      name: item.name ?? "",
      pathCollection: item.path_collection
        ? { entries: item.path_collection.entries || [] }
        : undefined,
    });
  }, []);

  useEffect(() => {
    if (!effectiveToken) return;
    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;

    if (!explorerRef.current) {
      explorerRef.current = new BoxGlobal.ContentExplorer();
    }

    const explorer = explorerRef.current;
    explorer?.removeAllListeners?.();
    explorer?.addListener?.("navigate", handleNavigate);
    explorer?.show(effectiveFolderId, effectiveToken, {
      container: "#box-content-explorer",
      canPreview: false,
      itemActions: customActions,
    });

    return () => {
      explorer?.removeAllListeners?.();
      explorer?.hide?.();
    };
  }, [customActions, effectiveFolderId, effectiveToken, handleNavigate]);

  const handleAddCollaborator = useCallback(async () => {
    if (!targetFolder) return;

    const selectedTarget =
      addType === "user" ? selectedUser : selectedDepartment;
    if (!selectedTarget) return;

    const nextCollaborator = buildCollaborator(
      addType,
      selectedTarget,
      selectedRole,
    );
    const currentCollaborators =
      collaboratorsByFolder[targetFolder.id] ?? MOCK_COLLABORATORS;
    const alreadyExists = currentCollaborators.some(
      (collab) =>
        collab.type === nextCollaborator.type &&
        collab.name === nextCollaborator.name,
    );

    if (alreadyExists) {
      toast.error("同じコラボレーターは既に設定されています");
      return;
    }

    setIsMutatingCollaboration(true);
    try {
      setCollaboratorsByFolder((prev) => ({
        ...prev,
        [targetFolder.id]: [...currentCollaborators, nextCollaborator],
      }));
      toast.success(`${nextCollaborator.name} を追加しました`);
      if (addType === "user") {
        setSelectedUser(null);
      } else {
        setSelectedDepartment(null);
      }
    } catch {
      toast.error("コラボレーターの追加に失敗しました");
    } finally {
      setIsMutatingCollaboration(false);
    }
  }, [
    addType,
    collaboratorsByFolder,
    selectedDepartment,
    selectedRole,
    selectedUser,
    targetFolder,
  ]);

  const handleRemoveCollaborator = useCallback(
    async (collaborator: Collaborator) => {
      if (!targetFolder) return;

      const currentCollaborators =
        collaboratorsByFolder[targetFolder.id] ?? MOCK_COLLABORATORS;

      setIsMutatingCollaboration(true);
      try {
        setCollaboratorsByFolder((prev) => ({
          ...prev,
          [targetFolder.id]: currentCollaborators.filter(
            (item) => item.id !== collaborator.id,
          ),
        }));
        toast.success(`${collaborator.name} を削除しました`);
      } catch {
        toast.error("コラボレーターの削除に失敗しました");
      } finally {
        setIsMutatingCollaboration(false);
      }
    },
    [collaboratorsByFolder, targetFolder],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <Layout
        hideTabs
        fluid
        headerProps={{
          subtitle: "共有領域管理",
          userDropdownMode: "simple",
        }}
      >
        <BoxManager />

        <div className="space-y-4 pb-8">
          <Card className="py-0">
            <CardContent className="py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-[140px] text-xs text-muted-foreground">
                  {breadcrumbLabel}
                </div>

                <div className="min-w-0 flex-1">
                  <Input
                    readOnly
                    value={currentPath}
                    className="h-8 bg-muted/30 font-mono text-sm"
                  />
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopyPath}
                        aria-label="パスをコピー"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>パスをコピー</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleOpenBox}
                        aria-label="Boxで開く"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Boxで開く</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleOpenExplorer}
                        aria-label="エクスプローラーで開く"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      エクスプローラー/Finderで開く
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            {canShowExplorer ? (
              <div
                id="box-content-explorer"
                className="min-h-[400px] max-h-[500px] [&_.be-logo]:hidden [&_.be-logo-container]:hidden [&_.be-header]:pl-3"
              />
            ) : (
              <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
                Box に接続中...
              </div>
            )}
          </Card>
        </div>

        <Dialog open={isPermissionDialogOpen} onOpenChange={handleClosePermissionDialog}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                共有領域管理
                {targetFolder && (
                  <Badge variant="outline" className="ml-2">
                    {targetFolder.name}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">コラボレーターを追加</div>
                  <div className="text-xs text-muted-foreground">
                    追加・削除は即時反映されます
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="flex w-fit shrink-0 gap-1 rounded-md bg-muted p-1">
                      <Button
                        variant={addType === "department" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setAddType("department")}
                        className="gap-1.5"
                        disabled={isMutatingCollaboration}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        部署
                      </Button>
                      <Button
                        variant={addType === "user" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setAddType("user")}
                        className="gap-1.5"
                        disabled={isMutatingCollaboration}
                      >
                        <User className="h-3.5 w-3.5" />
                        社員
                      </Button>
                    </div>

                    <div className="min-w-0 flex-1">
                      {addType === "user" ? (
                        <AutoCompleteSingle
                          type="user"
                          value={selectedUser}
                          placeholder="社員を検索..."
                          onChange={(value) => setSelectedUser(value)}
                        />
                      ) : (
                        <AutoCompleteSingle
                          type="center"
                          value={selectedDepartment}
                          placeholder="部署を検索..."
                          onChange={(value) => setSelectedDepartment(value)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-sm text-muted-foreground">
                        権限:
                      </span>
                      <Select
                        value={selectedRole}
                        onValueChange={(value) => setSelectedRole(value as RoleType)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <span className="flex items-center gap-2">
                                {role.label}
                                <span className="text-xs text-muted-foreground">
                                  ({role.description})
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleAddCollaborator}
                      disabled={
                        isMutatingCollaboration ||
                        (addType === "user" && !selectedUser) ||
                        (addType === "department" && !selectedDepartment)
                      }
                      className="shrink-0"
                    >
                      <UserPlus className="mr-1.5 h-4 w-4" />
                      追加
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  現在の権限設定
                  <Badge variant="outline" className="text-xs">
                    {dialogCollaborators.length}件
                  </Badge>
                </div>

                <div className="max-h-[300px] divide-y overflow-y-auto rounded-lg border">
                  {dialogCollaborators.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      コラボレーターが設定されていません
                    </div>
                  ) : (
                    dialogCollaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="group flex items-center justify-between p-3 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: collaborator.color || "#6b7280",
                            }}
                          >
                            {collaborator.type === "department" ? (
                              <Building2 className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {collaborator.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {collaborator.type === "department" ? "部署" : "社員"}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={
                              collaborator.role === "editor" ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            {
                              ROLE_OPTIONS.find(
                                (role) => role.value === collaborator.role,
                              )?.label
                            }
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7 text-muted-foreground transition-opacity hover:text-destructive",
                                  isMutatingCollaboration
                                    ? "opacity-40"
                                    : "opacity-0 group-hover:opacity-100",
                                )}
                                onClick={() =>
                                  handleRemoveCollaborator(collaborator)
                                }
                                aria-label="権限を削除"
                                disabled={isMutatingCollaboration}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>権限を削除</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClosePermissionDialog}>
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </TooltipProvider>
  );
};

export default SS;
