import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useSelector } from "react-redux";
import type { MultiValue, SingleValue } from "react-select";

import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { AutoCompleteMulti } from "@/components/parts/AutoComplete/AutoCompleteMulti";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Copy,
  ExternalLink,
  FolderOpen,
  X,
  UserPlus,
  Building2,
  User,
  Settings,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

import type { AutoCompleteData } from "@/api";
import type { BoxFolder } from "@/@types/BoxUiElements";
import { cn } from "@/lib/utils";
import "./SS.css";

// Box Content Explorer インスタンス型
type ContentExplorerInstance = {
  show: (folderId: string, token: string, opts: unknown) => void;
  hide?: () => void;
  removeAllListeners?: () => void;
  addListener?: (event: string, callback: (item: BoxFolder) => void) => void;
};

// 権限の役割定義
type RoleType = "editor" | "viewer";

const ROLE_OPTIONS: { value: RoleType; label: string; description: string }[] =
  [
    { value: "editor", label: "Editor", description: "編集可能" },
    { value: "viewer", label: "Viewer", description: "閲覧のみ" },
  ];

// コラボレーター情報の型定義
type CollaboratorType = "user" | "department";

type Collaborator = {
  id: string;
  type: CollaboratorType;
  name: string;
  role: RoleType;
  color?: string;
};

// モック: 既存のコラボレーター
const MOCK_COLLABORATORS: Collaborator[] = [
  {
    id: "1",
    type: "department",
    name: "東京センター",
    role: "editor",
    color: "#6366f1",
  },
  { id: "2", type: "user", name: "sre-user", role: "viewer", color: "#2563eb" },
  {
    id: "3",
    type: "department",
    name: "大阪DR",
    role: "viewer",
    color: "#ef4444",
  },
];

// 現在表示中のフォルダ情報
type CurrentFolderInfo = {
  id: string;
  name: string;
  pathCollection?: { entries: { id: string; name: string }[] };
};

export const SS = () => {
  const [searchParams] = useSearchParams();

  // URL パラメータから領域情報を取得
  const areaCode = searchParams.get("area") || "";
  const areaLabel = searchParams.get("label") || "";
  const folderName = searchParams.get("folder") || "";

  // Box トークン
  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;

  // 開発用トークン（URLパラメータまたはlocalStorage）
  const devToken = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const paramToken = params.get("devToken")?.trim();
    if (paramToken) return paramToken;
    const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
    return storedToken && storedToken.length > 0 ? storedToken : undefined;
  }, []);

  const effectiveToken = devToken ?? token;

  // 初期フォルダID
  const rawId =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("folderId");
  const isNumeric = /^\d+$/.test(rawId || "");
  const effectiveFolderId = isNumeric ? rawId! : "0";

  // Box Content Explorer ref
  const explorerRef = useRef<ContentExplorerInstance | null>(null);

  // 現在表示中のフォルダ情報（ContentExplorerのナビゲーションを追跡）
  const [currentFolder, setCurrentFolder] = useState<CurrentFolderInfo>({
    id: effectiveFolderId,
    name: folderName || "root",
    pathCollection: { entries: [] },
  });

  const canShowExplorer = Boolean(effectiveToken);

  // 権限設定ダイアログの状態
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [targetFolder, setTargetFolder] = useState<CurrentFolderInfo | null>(
    null
  );

  // コラボレーター一覧
  const [collaborators, setCollaborators] =
    useState<Collaborator[]>(MOCK_COLLABORATORS);

  // 新規追加用の状態
  const [addType, setAddType] = useState<"user" | "department">("department");
  const [selectedUser, setSelectedUser] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<
    MultiValue<AutoCompleteData>
  >([]);
  const [selectedRole, setSelectedRole] = useState<RoleType>("viewer");

  // 未適用の変更
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingAdds, setPendingAdds] = useState<Collaborator[]>([]);
  const [pendingRemoves, setPendingRemoves] = useState<string[]>([]);

  // 現在のパス文字列を生成（Windows UNC パス形式）
  const currentPath = useMemo(() => {
    const basePath = "\\\\tggfile.jp";
    const areaRoot = folderName ? `\\${folderName}` : "";

    // path_collectionからサブパスを構築
    const subPath =
      currentFolder.pathCollection?.entries
        ?.filter((entry) => entry.id !== "0") // ルートを除外
        .map((entry) => `\\${entry.name}`)
        .join("") || "";

    // 現在のフォルダ名を追加（ルートでない場合）
    const currentFolderPath =
      currentFolder.id !== effectiveFolderId && currentFolder.name !== "root"
        ? `\\${currentFolder.name}`
        : "";

    return `${basePath}${areaRoot}${subPath}${currentFolderPath}`;
  }, [folderName, currentFolder, effectiveFolderId]);

  // Box Web URL
  const boxWebUrl = useMemo(() => {
    return `https://app.box.com/folder/${currentFolder.id}`;
  }, [currentFolder.id]);

  // クリップボードにコピー
  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentPath);
      toast.success("パスをコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  }, [currentPath]);

  // Box を開く
  const handleOpenBox = useCallback(() => {
    window.open(boxWebUrl, "_blank", "noopener,noreferrer");
  }, [boxWebUrl]);

  // エクスプローラー/Finder を開く
  const handleOpenExplorer = useCallback(() => {
    // Windows のネットワークパスを file:// プロトコルで開く
    const fileUrl = `file://${currentPath.replace(/\\/g, "/")}`;
    window.open(fileUrl, "_blank");
    toast.info("エクスプローラーで開きます");
  }, [currentPath]);

  // マウント処理
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

  // 権限設定ダイアログを開く
  const handleOpenPermissionDialog = useCallback((item: BoxFolder) => {
    if (item.type !== "folder") return;

    setTargetFolder({
      id: item.id,
      name: item.name,
      pathCollection: item.path_collection
        ? { entries: item.path_collection.entries || [] }
        : undefined,
    });
    setIsPermissionDialogOpen(true);
  }, []);

  // カスタムアクション
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
    [handleMount, handleOpenPermissionDialog]
  );

  // フォルダナビゲーション時のコールバック
  const handleNavigate = useCallback((item: BoxFolder) => {
    if (item.type === "folder") {
      setCurrentFolder({
        id: item.id,
        name: item.name,
        pathCollection: item.path_collection
          ? { entries: item.path_collection.entries || [] }
          : undefined,
      });
    }
  }, []);

  // Box Content Explorer 初期化
  useEffect(() => {
    if (!effectiveToken) return;
    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;

    if (!explorerRef.current) {
      explorerRef.current = new BoxGlobal.ContentExplorer();
    }

    const explorer = explorerRef.current;

    explorer?.removeAllListeners?.();
    explorer?.show(effectiveFolderId, effectiveToken, {
      container: "#box-content-explorer",
      canPreview: false,
      itemActions: customActions,
    });

    // ナビゲーションイベントをリッスン
    explorer?.addListener?.("navigate", handleNavigate);

    return () => {
      explorer?.removeAllListeners?.();
      explorer?.hide?.();
    };
  }, [customActions, effectiveFolderId, effectiveToken, handleNavigate]);

  // コラボレーター追加
  const handleAddCollaborator = useCallback(() => {
    if (addType === "user" && selectedUser) {
      const newCollab: Collaborator = {
        id: `new-${Date.now()}`,
        type: "user",
        name: selectedUser.label,
        role: selectedRole,
        color: selectedUser.color,
      };
      setPendingAdds((prev) => [...prev, newCollab]);
      setSelectedUser(null);
      setHasChanges(true);
    } else if (addType === "department" && selectedDepartments.length > 0) {
      const newCollabs: Collaborator[] = selectedDepartments.map((dept) => ({
        id: `new-${Date.now()}-${dept.value}`,
        type: "department" as const,
        name: dept.label,
        role: selectedRole,
        color: dept.color,
      }));
      setPendingAdds((prev) => [...prev, ...newCollabs]);
      setSelectedDepartments([]);
      setHasChanges(true);
    }
  }, [addType, selectedUser, selectedDepartments, selectedRole]);

  // コラボレーター削除（既存）
  const handleRemoveCollaborator = useCallback((id: string) => {
    setPendingRemoves((prev) => [...prev, id]);
    setHasChanges(true);
  }, []);

  // 未確定の追加を取り消し
  const handleRemovePendingAdd = useCallback(
    (id: string) => {
      setPendingAdds((prev) => prev.filter((c) => c.id !== id));
      const remaining = pendingAdds.filter((c) => c.id !== id);
      setHasChanges(remaining.length > 0 || pendingRemoves.length > 0);
    },
    [pendingAdds, pendingRemoves],
  );

  // 変更を適用
  const handleApply = useCallback(() => {
    setCollaborators((prev) => {
      const filtered = prev.filter((c) => !pendingRemoves.includes(c.id));
      return [...filtered, ...pendingAdds];
    });
    setPendingAdds([]);
    setPendingRemoves([]);
    setHasChanges(false);
    toast.success("権限設定を適用しました");
    setIsPermissionDialogOpen(false);
  }, [pendingAdds, pendingRemoves]);

  // 変更をキャンセル
  const handleCancel = useCallback(() => {
    setPendingAdds([]);
    setPendingRemoves([]);
    setHasChanges(false);
    setIsPermissionDialogOpen(false);
  }, []);

  // 表示するコラボレーター一覧
  const displayCollaborators = useMemo(() => {
    const existing = collaborators.filter(
      (c) => !pendingRemoves.includes(c.id),
    );
    return [...existing, ...pendingAdds];
  }, [collaborators, pendingRemoves, pendingAdds]);

  return (
    <TooltipProvider delayDuration={100}>
      <Layout
        hideTabs
        fluid
        headerProps={{
          title: "SS",
          subtitle: areaLabel || undefined,
          userDropdownMode: "simple",
        }}
      >
        <BoxManager />

        <div className="space-y-4 pb-8">
          {/* パスバー */}
          <Card className="py-0">
            <CardContent className="py-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* パス入力 */}
                <div className="flex-1 min-w-0">
                  <Input
                    readOnly
                    value={currentPath}
                    className="font-mono text-sm bg-muted/30 h-8"
                  />
                </div>

                {/* アクションボタン */}
                <div className="flex items-center gap-1 shrink-0">
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

          {/* Contents Explorer */}
          <Card className="overflow-hidden">
            {canShowExplorer ? (
              <div
                id="box-content-explorer"
                className="min-h-[400px] max-h-[500px] [&_.be-logo]:hidden [&_.be-logo-container]:hidden [&_.be-header]:pl-3"
              />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                Box に接続中...
              </div>
            )}
          </Card>
        </div>

        {/* 権限設定ダイアログ */}
        <Dialog
          open={isPermissionDialogOpen}
          onOpenChange={setIsPermissionDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                コラボレーション設定
                {targetFolder && (
                  <Badge variant="outline" className="ml-2">
                    {targetFolder.name}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* 権限追加フォーム */}
              <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                <div className="text-sm font-medium">新しい権限を追加</div>

                <div className="flex flex-col gap-3">
                  {/* 1行目: タイプ選択 + AutoComplete */}
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* タイプ選択 */}
                    <div className="flex gap-1 p-1 bg-muted rounded-md shrink-0 w-fit">
                      <Button
                        variant={
                          addType === "department" ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() => setAddType("department")}
                        className="gap-1.5"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        部署
                      </Button>
                      <Button
                        variant={addType === "user" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setAddType("user")}
                        className="gap-1.5"
                      >
                        <User className="h-3.5 w-3.5" />
                        社員
                      </Button>
                    </div>

                    {/* AutoComplete */}
                    <div className="flex-1 min-w-0">
                      {addType === "user" ? (
                        <AutoCompleteSingle
                          type="user"
                          value={selectedUser}
                          placeholder="社員を検索..."
                          onChange={(val) => setSelectedUser(val)}
                        />
                      ) : (
                        <AutoCompleteMulti
                          type="center"
                          value={selectedDepartments}
                          placeholder="部署を検索..."
                          onChange={(val) => setSelectedDepartments(val)}
                        />
                      )}
                    </div>
                  </div>

                  {/* 2行目: Role選択 + 追加ボタン */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground shrink-0">
                        権限:
                      </span>
                      <Select
                        value={selectedRole}
                        onValueChange={(val) =>
                          setSelectedRole(val as RoleType)
                        }
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
                        (addType === "user" && !selectedUser) ||
                        (addType === "department" &&
                          selectedDepartments.length === 0)
                      }
                      className="shrink-0"
                    >
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      追加
                    </Button>
                  </div>
                </div>
              </div>

              {/* 現在のコラボレーター一覧 */}
              <div className="space-y-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  現在の権限設定
                  <Badge variant="outline" className="text-xs">
                    {displayCollaborators.length}件
                  </Badge>
                </div>

                <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                  {displayCollaborators.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      コラボレーターが設定されていません
                    </div>
                  ) : (
                    displayCollaborators.map((collab) => {
                      const isPending = collab.id.startsWith("new-");
                      const isRemoving = pendingRemoves.includes(collab.id);

                      return (
                        <div
                          key={collab.id}
                          className={cn(
                            "flex items-center justify-between p-3 group hover:bg-muted/30 transition-colors",
                            isPending && "bg-emerald-50 dark:bg-emerald-950/20",
                            isRemoving && "opacity-50 line-through"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                              style={{
                                backgroundColor: collab.color || "#6b7280",
                              }}
                            >
                              {collab.type === "department" ? (
                                <Building2 className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate flex items-center gap-2">
                                {collab.name}
                                {isPending && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs shrink-0"
                                  >
                                    追加予定
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {collab.type === "department" ? "部署" : "社員"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={
                                collab.role === "editor" ? "default" : "outline"
                              }
                              className="text-xs"
                            >
                              {
                                ROLE_OPTIONS.find((r) => r.value === collab.role)
                                  ?.label
                              }
                            </Badge>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    isPending
                                      ? handleRemovePendingAdd(collab.id)
                                      : handleRemoveCollaborator(collab.id)
                                  }
                                  aria-label="権限を削除"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>権限を削除</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCancel}>
                キャンセル
              </Button>
              <Button onClick={handleApply} disabled={!hasChanges}>
                適用
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </TooltipProvider>
  );
};

export default SS;
