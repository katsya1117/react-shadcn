import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";

import type { AutoCompleteData } from "@/api";
import { Layout } from "@/components/frame/Layout";
import { AutoCompleteSingle } from "@/components/parts/AutoComplete/AutoCompleteSingle";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { autoCompleteSelector } from "@/redux/slices/autoCompleteSlice";
import { boxSelector } from "@/redux/slices/userSlice";
import { cn } from "@/lib/utils";
import {
  Building2,
  Copy,
  EyeOff,
  ExternalLink,
  Folder,
  FolderOpen,
  User,
  UserPlus,
  X,
} from "lucide-react";

type ContentExplorerInstance = {
  show: (folderId: string, token: string, opts: unknown) => void;
  hide?: () => void;
  removeAllListeners?: () => void;
  addListener?: (event: string, callback: (item: unknown) => void) => void;
};

type RoleType = "editor" | "viewer";
type CollaboratorType = "user" | "department";

type Collaborator = {
  id: string;
  type: CollaboratorType;
  name: string;
  role: RoleType;
  canViewPath: boolean;
  // そのコラボレートが直接設定されたフォルダID
  sourceFolderId: string;
};

type CollaborationState = {
  direct: Collaborator[];
};

type FolderInfo = {
  id: string;
  name: string;
  pathCollection?: { entries: { id: string; name: string }[] };
};

type CollaborationPanelProps = {
  folderName: string;
  collaborators: CollaborationListItem[];
  isBusy: boolean;
  selectedCollaborator: SingleValue<AutoCompleteData>;
  selectedRole: RoleType;
  onSelectedCollaboratorChange: (
    value: SingleValue<AutoCompleteData>,
  ) => void;
  onSelectedRoleChange: (role: RoleType) => void;
  onAddCollaborator: () => void;
  onRemoveCollaborator: (collaborator: Collaborator) => void;
};

type PathBarProps = {
  folderName: string;
  relativePath: string;
  onCopyPath: () => void;
  onOpenBox: () => void;
  onOpenExplorer: () => void;
};

type CollaborationListItem = {
  collaborator: Collaborator;
  isInherited: boolean;
  canRemove: boolean;
  sourcePath?: string;
};

const ROOT_SHARE_PATH = "\\\\tggfile.jp\\share";
const DISPLAY_PATH_ROOT = "\\";
const DEFAULT_ROLE: RoleType = "viewer";
const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

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

const FolderActionButtons = ({
  onCopyPath,
  onOpenBox,
  onOpenExplorer,
}: {
  onCopyPath: () => void;
  onOpenBox: () => void;
  onOpenExplorer: () => void;
}) => (
  <div className="flex shrink-0 items-center gap-0.5">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onCopyPath}
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
          variant="ghost"
          size="icon-sm"
          className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onOpenBox}
          aria-label="Boxで開く"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Web Boxで開く</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onOpenExplorer}
          aria-label="Box Driveで開く"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Box Driveで開く</TooltipContent>
    </Tooltip>
  </div>
);

const PathBar = ({
  folderName,
  relativePath,
  onCopyPath,
  onOpenBox,
  onOpenExplorer,
}: PathBarProps) => {
  const displayPath = relativePath
    ? `${DISPLAY_PATH_ROOT}${relativePath}`
    : DISPLAY_PATH_ROOT;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
      <div className="min-w-0 flex-1">
        <div className="relative flex min-w-0 items-center gap-2 pb-2 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-border/60">
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground/75" />
          <div
            className="truncate font-mono text-[13px] leading-6 text-foreground/90"
            title={displayPath}
          >
            {displayPath}
          </div>
        </div>
      </div>

      <FolderActionButtons
        onCopyPath={onCopyPath}
        onOpenBox={onOpenBox}
        onOpenExplorer={onOpenExplorer}
      />
    </div>
  );
};

const CollaboratorRow = ({
  item,
  isBusy,
  onRemove,
}: {
  item: CollaborationListItem;
  isBusy: boolean;
  onRemove: (collaborator: Collaborator) => void;
}) => {
  const { collaborator, isInherited, canRemove, sourcePath } = item;

  return (
    <div
      className={cn(
        "group flex items-start justify-between gap-3 px-3 py-2 transition-colors hover:bg-muted/20",
        isInherited && "bg-muted/45",
        !collaborator.canViewPath && "opacity-50",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="min-w-0 flex items-center gap-2 overflow-hidden">
          {collaborator.type === "department" ? (
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm font-medium">{collaborator.name}</span>
          <Badge
            variant={collaborator.role === "editor" ? "default" : "outline"}
            className="h-5 px-1.5 text-[10px]"
          >
            {ROLE_OPTIONS.find((role) => role.value === collaborator.role)?.label}
          </Badge>
          {!collaborator.canViewPath ? (
            <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          ) : null}
        </div>

        {isInherited && sourcePath ? (
          <div className="truncate pl-6 text-[11px] text-muted-foreground">
            {sourcePath}
          </div>
        ) : null}
      </div>

      {canRemove ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 shrink-0 text-muted-foreground transition-opacity hover:text-destructive",
                isBusy ? "opacity-40" : "opacity-0 group-hover:opacity-100",
              )}
              onClick={() => onRemove(collaborator)}
              aria-label="権限を削除"
              disabled={isBusy}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>権限を削除</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
};

const CollaborationPanel = ({
  folderName,
  collaborators,
  isBusy,
  selectedCollaborator,
  selectedRole,
  onSelectedCollaboratorChange,
  onSelectedRoleChange,
  onAddCollaborator,
  onRemoveCollaborator,
}: CollaborationPanelProps) => (
  <Card className="h-fit rounded-2xl border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_36px_-22px_rgba(15,23,42,0.22)] xl:sticky xl:top-4">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{folderName}</CardTitle>
    </CardHeader>

    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div className="text-sm font-medium">コラボレーターを追加</div>

        <AutoCompleteSingle
          type="userGroup"
          value={selectedCollaborator}
          placeholder="部署・社員を検索..."
          onChange={(value) => onSelectedCollaboratorChange(value)}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select
            value={selectedRole}
            onValueChange={(value) => onSelectedRoleChange(value as RoleType)}
          >
            <SelectTrigger className="w-full justify-start gap-1 rounded-full border-transparent bg-transparent px-3 text-left shadow-none hover:bg-muted focus-visible:border-transparent focus-visible:ring-0 data-[state=open]:bg-muted sm:w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={onAddCollaborator}
            disabled={isBusy || !selectedCollaborator}
            className="shrink-0"
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            追加
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="text-sm font-medium">コラボレータ一覧</div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
          {collaborators.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              コラボレーターは設定されていません
            </div>
          ) : (
            <div className="divide-y">
              {collaborators.map((item) => (
                <CollaboratorRow
                  key={item.collaborator.id}
                  item={item}
                  isBusy={isBusy}
                  onRemove={onRemoveCollaborator}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

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
          <PathBar
            folderName={selectedFolderName}
            relativePath={selectedFolderRelativePath}
            onCopyPath={handleCopyPath}
            onOpenBox={handleOpenBox}
            onOpenExplorer={handleOpenExplorer}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="overflow-hidden rounded-2xl border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_36px_-22px_rgba(15,23,42,0.18)]">
              {accessToken ? (
                <div
                  id="box-content-explorer"
                  className="min-h-[520px] [&_.be-logo]:hidden [&_.be-logo-container]:hidden [&_.be-header]:pl-3"
                />
              ) : (
                <div className="flex min-h-[520px] items-center justify-center text-sm text-muted-foreground">
                  Box に接続中...
                </div>
              )}
            </Card>

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
      </Layout>
    </TooltipProvider>
  );
};

export default SS;
