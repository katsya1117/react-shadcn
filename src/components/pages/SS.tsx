import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";

import type { AutoCompleteData } from "@/api";
import type { BoxFolder } from "@/@types/BoxUiElements";
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
  ExternalLink,
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
  relativePath: string;
  collaborators: Collaborator[];
  isBusy: boolean;
  selectedCollaborator: SingleValue<AutoCompleteData>;
  selectedRole: RoleType;
  onSelectedCollaboratorChange: (
    value: SingleValue<AutoCompleteData>,
  ) => void;
  onSelectedRoleChange: (role: RoleType) => void;
  onAddCollaborator: () => void;
  onRemoveCollaborator: (collaborator: Collaborator) => void;
  onCopyPath: () => void;
  onOpenBox: () => void;
  onOpenExplorer: () => void;
};

const ROOT_SHARE_PATH = "\\\\tggfile.jp\\share";
const BOX_DRIVE_BASE_SEGMENTS = ["isexplorer:C:", "Users", "xxxx.xxxx", "Box"];
const DEFAULT_ROLE: RoleType = "viewer";
const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const readDevToken = () => {
  if (typeof window === "undefined") return undefined;

  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("devToken")?.trim();
  if (queryToken) return queryToken;

  const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
  return storedToken && storedToken.length > 0 ? storedToken : undefined;
};

const normalizeFolderId = (folderId?: string) =>
  /^\d+$/.test(folderId || "") ? folderId! : "0";

const sanitizePathName = (id: string, name?: string | null) => {
  if (id === "0" || name === "すべてのファイル") return "share";
  return name || "root";
};

const createFolderInfo = (folderId: string): FolderInfo => ({
  id: folderId,
  name: folderId === "0" ? "All Files" : "",
  pathCollection: { entries: [] },
});

const toFolderInfo = (
  item: Pick<BoxFolder, "id" | "name" | "path_collection">,
): FolderInfo => ({
  id: item.id,
  name: item.name ?? "",
  pathCollection: item.path_collection
    ? { entries: item.path_collection.entries || [] }
    : undefined,
});

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

const getRelativeSharePath = (path: string) => {
  if (path === ROOT_SHARE_PATH) return "";
  return path.startsWith(`${ROOT_SHARE_PATH}\\`)
    ? path.slice(`${ROOT_SHARE_PATH}\\`.length)
    : path;
};

const buildBoxDriveUri = (folder: BoxFolder) => {
  const entrySegments =
    folder.path_collection?.entries
      ?.filter((entry) => entry.id !== "0")
      .map((entry) => entry.name) ?? [];

  return encodeURI(
    [...BOX_DRIVE_BASE_SEGMENTS, ...entrySegments, folder.name].join("\\"),
  );
};

const buildCollaborator = ({
  folderId,
  option,
  role,
  type,
}: {
  folderId: string;
  option: AutoCompleteData;
  role: RoleType;
  type: CollaboratorType;
}): Collaborator => ({
  id: `${folderId}:${type}:${option.value}`,
  type,
  name: option.label,
  role,
  canViewPath: true,
});

const createMockCollaborationState = (folderId: string): CollaborationState => ({
  direct: [
    {
      id: `${folderId}:department:tokyo`,
      type: "department",
      name: "東京センター",
      role: "editor",
      canViewPath: true,
    },
    {
      id: `${folderId}:user:sre`,
      type: "user",
      name: "sre-user",
      role: "viewer",
      canViewPath: true,
    },
    {
      id: `${folderId}:user:legacy`,
      type: "user",
      name: "legacy-user",
      role: "viewer",
      canViewPath: false,
    },
  ],
});

const getCollaborationState = (
  collaborationsByFolderId: Record<string, CollaborationState>,
  folderId: string,
) => collaborationsByFolderId[folderId] ?? createMockCollaborationState(folderId);

const getCollaboratorType = ({
  option,
  users,
  groups,
}: {
  option: AutoCompleteData;
  users: AutoCompleteData[];
  groups: AutoCompleteData[];
}): CollaboratorType => {
  if (groups.some((group) => group.value === option.value)) {
    return "department";
  }

  if (users.some((user) => user.value === option.value)) {
    return "user";
  }

  return "user";
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
  <div className="flex shrink-0 items-center gap-1">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
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
          variant="outline"
          size="icon"
          className="h-8 w-8"
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
          variant="outline"
          size="icon"
          className="h-8 w-8"
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

const CollaboratorRow = ({
  collaborator,
  isBusy,
  onRemove,
}: {
  collaborator: Collaborator;
  isBusy: boolean;
  onRemove: (collaborator: Collaborator) => void;
}) => (
  <div
    className={cn(
      "group flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-muted/30",
      !collaborator.canViewPath && "opacity-45",
    )}
  >
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
    </div>

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
  </div>
);

const CollaborationPanel = ({
  folderName,
  relativePath,
  collaborators,
  isBusy,
  selectedCollaborator,
  selectedRole,
  onSelectedCollaboratorChange,
  onSelectedRoleChange,
  onAddCollaborator,
  onRemoveCollaborator,
  onCopyPath,
  onOpenBox,
  onOpenExplorer,
}: CollaborationPanelProps) => (
  <Card className="h-fit xl:sticky xl:top-4">
    <CardHeader className="space-y-2">
      <CardTitle className="text-lg">{folderName}</CardTitle>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 break-all text-xs text-muted-foreground">
          {relativePath || "/"}
        </div>
        <FolderActionButtons
          onCopyPath={onCopyPath}
          onOpenBox={onOpenBox}
          onOpenExplorer={onOpenExplorer}
        />
      </div>
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

        <div className="overflow-hidden rounded-lg border">
          {collaborators.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              コラボレーターは設定されていません
            </div>
          ) : (
            <div className="divide-y">
              {collaborators.map((collaborator) => (
                <CollaboratorRow
                  key={collaborator.id}
                  collaborator={collaborator}
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
  const rootFolderId = normalizeFolderId(routeFolderId);
  const explorerRef = useRef<ContentExplorerInstance | null>(null);

  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;
  const users = useSelector(autoCompleteSelector.usersSelector());
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const devToken = useMemo(readDevToken, []);
  const accessToken = devToken ?? token;

  const [selectedFolder, setSelectedFolder] = useState<FolderInfo>(() =>
    createFolderInfo(rootFolderId),
  );
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);
  const [isSavingCollaborator, setIsSavingCollaborator] = useState(false);
  const [collaborationsByFolderId, setCollaborationsByFolderId] = useState<
    Record<string, CollaborationState>
  >({});

  const selectedFolderPath = useMemo(
    () => buildSharePath(selectedFolder, rootFolderId),
    [selectedFolder, rootFolderId],
  );
  const selectedFolderRelativePath = useMemo(
    () => getRelativeSharePath(selectedFolderPath),
    [selectedFolderPath],
  );
  const selectedFolderName = selectedFolder.name || "対象フォルダ";
  const collaborators = useMemo(
    () =>
      getCollaborationState(collaborationsByFolderId, selectedFolder.id).direct,
    [collaborationsByFolderId, selectedFolder.id],
  );

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  useEffect(() => {
    setSelectedFolder(createFolderInfo(rootFolderId));
    resetForm();
  }, [rootFolderId, resetForm]);

  const syncSelectedFolder = useCallback(
    (payload: unknown) => {
      const folder = extractFolderFromEvent(payload);
      if (!folder || folder.type !== "folder") return;

      setSelectedFolder(toFolderInfo(folder));
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

  const handleMount = useCallback((item: BoxFolder) => {
    if (item.type !== "folder") return;
    window.location.assign(buildBoxDriveUri(item));
  }, []);

  const explorerActions = useMemo(
    () => [
      {
        label: "マウント",
        onAction: (item: BoxFolder) => handleMount(item),
        type: "folder",
      },
    ],
    [handleMount],
  );

  useEffect(() => {
    if (!accessToken) return;

    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;

    if (!explorerRef.current) {
      explorerRef.current = new BoxGlobal.ContentExplorer();
    }

    const explorer = explorerRef.current;
    explorer.removeAllListeners?.();
    explorer.addListener?.("navigate", syncSelectedFolder);
    explorer.addListener?.("select", syncSelectedFolder);
    explorer.show(rootFolderId, accessToken, {
      container: "#box-content-explorer",
      canPreview: false,
      itemActions: explorerActions,
    });

    return () => {
      explorer.removeAllListeners?.();
      explorer.hide?.();
    };
  }, [accessToken, explorerActions, rootFolderId, syncSelectedFolder]);

  const handleAddCollaborator = useCallback(async () => {
    if (!selectedCollaborator) return;

    const collaboratorType = getCollaboratorType({
      option: selectedCollaborator,
      users,
      groups,
    });
    const nextCollaborator = buildCollaborator({
      folderId: selectedFolder.id,
      option: selectedCollaborator,
      role: selectedRole,
      type: collaboratorType,
    });

    const currentState = getCollaborationState(
      collaborationsByFolderId,
      selectedFolder.id,
    );
    const alreadyExists = currentState.direct.some(
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
        const state = getCollaborationState(prev, selectedFolder.id);
        return {
          ...prev,
          [selectedFolder.id]: {
            direct: [...state.direct, nextCollaborator],
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
          const state = getCollaborationState(prev, selectedFolder.id);
          return {
            ...prev,
            [selectedFolder.id]: {
              direct: state.direct.filter((item) => item.id !== collaborator.id),
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
    [selectedFolder.id],
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

        <div className="pb-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="overflow-hidden">
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
              relativePath={selectedFolderRelativePath}
              collaborators={collaborators}
              isBusy={isSavingCollaborator}
              selectedCollaborator={selectedCollaborator}
              selectedRole={selectedRole}
              onSelectedCollaboratorChange={setSelectedCollaborator}
              onSelectedRoleChange={setSelectedRole}
              onAddCollaborator={handleAddCollaborator}
              onRemoveCollaborator={handleRemoveCollaborator}
              onCopyPath={handleCopyPath}
              onOpenBox={handleOpenBox}
              onOpenExplorer={handleOpenExplorer}
            />
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default SS;
