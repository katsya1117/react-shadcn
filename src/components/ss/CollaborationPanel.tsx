import { useState } from "react";
import type { SingleValue } from "react-select";
import {
  Building2,
  CornerDownRight,
  EyeOff,
  User,
  UserPlus,
  X,
} from "lucide-react";

import type { AutoCompleteData } from "@/api";
import { AutoCompleteSingle } from "@/components/parts/AutoComplete/AutoCompleteSingle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useConfirmState } from "@/hooks/useConfirmState";

import { ROLE_OPTIONS } from "./constants";
import type { CollaborationListItem, Collaborator, RoleType } from "./types";
import { ConfirmButton } from "../parts/Confirm/ConfirmButton";
import { ConfirmDialog } from "../parts/Confirm/ConfirmDialog";

const getRoleLabel = (role: RoleType) =>
  ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

const TooltipText = ({
  children,
  text,
  className,
}: {
  children: string;
  text: string;
  className?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className={cn("block w-full truncate", className)}>{children}</span>
    </TooltipTrigger>
    <TooltipContent>{text}</TooltipContent>
  </Tooltip>
);

const CollaboratorRowSkeleton = () => (
  <div className="px-3 py-2.5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="pl-6">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-6 w-6 rounded-md" />
    </div>
  </div>
);

type CollaboratorRowProps = {
  item: CollaborationListItem;
  isBusy: boolean;
  onUpdateRole: (
    collaborator: Collaborator,
    role: RoleType,
  ) => Promise<void> | void;
  onRemove: (collaborator: Collaborator) => void;
};

const CollaboratorRow = ({
  item,
  isBusy,
  onUpdateRole,
  onRemove,
}: CollaboratorRowProps) => {
  const { collaborator, isInherited, canRemove, sourcePath } = item;
  // 編集可否は direct / inherited ではなく can_view_path=true かどうかで決める。
  // 本アプリ経由で管理する collaboration だけを操作可能にし、
  // Box UI 由来の can_view_path=false は一覧表示のみ。
  const [pendingRole, setPendingRole] = useState<RoleType>(collaborator.role);
  const { isOpen, open, handleOpenChange } = useConfirmState();
  // inherited 行を触る時は、現在フォルダではなく継承元の collaboration を変更する。
  // 誤解を減らすため、確認ダイアログに sourcePath を明示する。
  const updateDialogBody =
    isInherited && sourcePath
      ? `${collaborator.name} の継承元コラボレーション（${sourcePath}）を ${getRoleLabel(pendingRole)} に変更します。`
      : `${collaborator.name} のロールを ${getRoleLabel(pendingRole)} に変更します。`;
  const removeDialogBody =
    isInherited && sourcePath
      ? `${collaborator.name} の継承元コラボレーション（${sourcePath}）を削除します。`
      : `${collaborator.name} のコラボレーションを削除します。`;
  return (
    <div
      className={cn(
        "group px-3 py-2.5 transition-colors hover:bg-muted/20",
        isInherited && "bg-muted/55",
        !canRemove && "opacity-55",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 flex items-center text-muted-foreground">
          {isInherited && <CornerDownRight className="size-4" />}
          {collaborator.type === "department" ? (
            <Building2 className="size-4" />
          ) : (
            <User className="size-4" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex w-full items-center justify-between text-sm font-medium text-foreground">
            <TooltipText text={collaborator.name} className="min-w-0 flex-1">
              {collaborator.name}
            </TooltipText>

            {!canRemove ? (
              <EyeOff className="size-3.5 shrink-0 text-muted-foreground/80" />
            ) : (
              <ConfirmButton
                buttonLabel={<X className="h-3.5 w-3.5" />}
                dialogTitle="コラボレーションを削除しますか？"
                dialogBody={removeDialogBody}
                onHandle={() => onRemove(collaborator)}
                variant="ghost"
                size="icon-xs"
                className={cn(
                  "shrink-0 text-muted-foreground transition-opacity hover:text-destructive",
                  isBusy ? "opacity-40" : "opacity-0 group-hover:opacity-100",
                )}
                aria-label="権限を削除"
                disabled={isBusy}
              />
            )}
          </div>

          {canRemove ? (
            <>
              <Select
                value={pendingRole}
                onValueChange={(value) => {
                  const nextRole = value as RoleType;
                  setPendingRole(nextRole);
                  if (nextRole === collaborator.role) return;
                  open();
                }}
                disabled={isBusy}
              >
                <SelectTrigger size="xs" className="shadow-none">
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
              <ConfirmDialog
                open={isOpen}
                onOpenChange={(nextOpen) => {
                  handleOpenChange(nextOpen);
                  if (!nextOpen) setPendingRole(collaborator.role);
                }}
                dialogTitle="ロールの変更"
                onHandle={() => onUpdateRole(collaborator, pendingRole)}
              >
                {updateDialogBody}
              </ConfirmDialog>
            </>
          ) : (
            <Badge
              variant="outline"
              className="h-6 w-fit max-w-full px-2 font-normal leading-none"
            >
              {getRoleLabel(collaborator.role)}
            </Badge>
          )}

          {isInherited && sourcePath && (
            <TooltipText
              text={sourcePath}
              className="text-xs leading-5 text-muted-foreground"
            >
              {sourcePath}
            </TooltipText>
          )}
        </div>
      </div>
    </div>
  );
};

type CollaborationPanelProps = {
  folderName: string;
  collaborators: CollaborationListItem[];
  isListLoading?: boolean;
  isBusy: boolean;
  selectedCollaborator: SingleValue<AutoCompleteData>;
  selectedRole: RoleType;
  onSelectedCollaboratorChange: (value: SingleValue<AutoCompleteData>) => void;
  onSelectedRoleChange: (role: RoleType) => void;
  onAddCollaborator: () => Promise<void> | void;
  onUpdateCollaboratorRole: (
    collaborator: Collaborator,
    role: RoleType,
  ) => Promise<void> | void;
  onRemoveCollaborator: (collaborator: Collaborator) => void;
  className?: string;
};

export const CollaborationPanel = ({
  folderName,
  collaborators,
  isListLoading = false,
  isBusy,
  selectedCollaborator,
  selectedRole,
  onSelectedCollaboratorChange,
  onSelectedRoleChange,
  onAddCollaborator,
  onUpdateCollaboratorRole,
  onRemoveCollaborator,
  className,
}: CollaborationPanelProps) => {
  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-lg">{folderName}</CardTitle>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="space-y-3 shrink-0">
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
              disabled={isBusy}
            >
              <SelectTrigger
                size="xs"
                className="w-full justify-start bg-background text-left shadow-none hover:bg-muted/70 focus-visible:ring-0 sm:w-auto"
              >
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

            <ConfirmButton
              buttonLabel={
                <>
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  追加
                </>
              }
              dialogTitle="コラボレーションを追加しますか？"
              dialogBody={
                selectedCollaborator
                  ? `${selectedCollaborator.label} を ${getRoleLabel(selectedRole)} で追加します。`
                  : undefined
              }
              onHandle={onAddCollaborator}
              variant="default"
              disabled={isBusy || !selectedCollaborator}
              className="shrink-0"
            />
          </div>
        </div>

        <Separator />

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="text-sm font-medium">コラボレータ一覧</div>

          <div className="flex-1 min-h-0 overflow-y-auto rounded-md border bg-background">
            {isListLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, index) => (
                  <CollaboratorRowSkeleton key={index} />
                ))}
              </div>
            ) : collaborators.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                コラボレーターは設定されていません
              </div>
            ) : (
              <div className="divide-y">
                {collaborators.map((item) => (
                  <CollaboratorRow
                    key={`${item.collaborator.id}:${item.collaborator.role}:${item.isInherited ? "inherited" : "direct"}`}
                    item={item}
                    isBusy={isBusy}
                    onUpdateRole={onUpdateCollaboratorRole}
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
};
