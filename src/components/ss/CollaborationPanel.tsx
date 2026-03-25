import { useEffect, useRef, useState } from "react";
import type { SingleValue } from "react-select";
import { Building2, EyeOff, User, UserPlus, X } from "lucide-react";

import type { AutoCompleteData } from "@/api";
import { AutoCompleteSingle } from "@/components/parts/AutoComplete/AutoCompleteSingle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Separator } from "@/components/ui/separator";
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

import { ROLE_OPTIONS } from "./constants";
import type { CollaborationListItem, Collaborator, RoleType } from "./types";

const getRoleLabel = (role: RoleType) =>
  ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

const OverflowTooltip = ({
  children,
  text,
  className,
}: {
  children: string;
  text: string;
  className?: string;
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [element, setElement] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!element) return;

    const update = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth);
    };

    update();

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [element, text]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={setElement}
          className={cn("block w-full truncate", className)}
          title={isOverflowing ? undefined : text}
        >
          {children}
        </span>
      </TooltipTrigger>
      {isOverflowing ? <TooltipContent>{text}</TooltipContent> : null}
    </Tooltip>
  );
};

type CollaboratorRowProps = {
  item: CollaborationListItem;
  isBusy: boolean;
  onUpdateRole: (collaborator: Collaborator, role: RoleType) => Promise<void> | void;
  onRemove: (collaborator: Collaborator) => void;
};

const CollaboratorRow = ({
  item,
  isBusy,
  onUpdateRole,
  onRemove,
}: CollaboratorRowProps) => {
  const { collaborator, isInherited, canRemove, sourcePath } = item;
  const canEditRole = !isInherited && collaborator.canViewPath;
  const [pendingRole, setPendingRole] = useState<RoleType>(collaborator.role);
  const [isRoleConfirmOpen, setIsRoleConfirmOpen] = useState(false);

  useEffect(() => {
    setPendingRole(collaborator.role);
  }, [collaborator.role]);

  return (
    <div
      className={cn(
        "group px-3 py-2.5 transition-colors hover:bg-muted/20",
        isInherited && "bg-muted/55",
        !collaborator.canViewPath && "opacity-55",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex min-w-0 items-start gap-2">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
              {collaborator.type === "department" ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex flex-1 items-center gap-2 text-sm font-medium leading-5 text-foreground">
              <OverflowTooltip text={collaborator.name} className="min-w-0 flex-1">
                {collaborator.name}
              </OverflowTooltip>
              {!collaborator.canViewPath ? (
                <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
              ) : null}
            </div>
          </div>

          <div className="pl-6">
            {canEditRole ? (
              <>
                <Select
                  value={pendingRole}
                  onValueChange={(value) => {
                    const nextRole = value as RoleType;
                    setPendingRole(nextRole);
                    setIsRoleConfirmOpen(nextRole !== collaborator.role);
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
                <ConfirmButton
                  buttonLabel={null}
                  dialogTitle="ロールを更新しますか？"
                  dialogBody={`${collaborator.name} のロールを ${getRoleLabel(pendingRole)} に変更します。`}
                  onHandle={() => onUpdateRole(collaborator, pendingRole)}
                  open={isRoleConfirmOpen}
                  onOpenChange={(open) => {
                    setIsRoleConfirmOpen(open);
                    if (!open) {
                      setPendingRole(collaborator.role);
                    }
                  }}
                  hideTrigger
                />
              </>
            ) : (
              <Badge
                variant="outline"
                className="h-6 w-fit max-w-full px-2 font-normal leading-none"
              >
                {getRoleLabel(collaborator.role)}
              </Badge>
            )}
          </div>

          {isInherited && sourcePath ? (
            <div className="pl-6">
              <OverflowTooltip
                text={sourcePath}
                className="text-xs leading-5 text-muted-foreground"
              >
                {sourcePath}
              </OverflowTooltip>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-start justify-end">
          {canRemove ? (
            <ConfirmButton
              buttonLabel={<X className="h-3.5 w-3.5" />}
              dialogTitle="コラボレーションを削除しますか？"
              dialogBody={`${collaborator.name} のコラボレーションを削除します。`}
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
          ) : null}
        </div>
      </div>
    </div>
  );
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
  onAddCollaborator: () => Promise<void> | void;
  onUpdateCollaboratorRole: (
    collaborator: Collaborator,
    role: RoleType,
  ) => Promise<void> | void;
  onRemoveCollaborator: (collaborator: Collaborator) => void;
};

export const CollaborationPanel = ({
  folderName,
  collaborators,
  isBusy,
  selectedCollaborator,
  selectedRole,
  onSelectedCollaboratorChange,
  onSelectedRoleChange,
  onAddCollaborator,
  onUpdateCollaboratorRole,
  onRemoveCollaborator,
}: CollaborationPanelProps) => {
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listMaxHeight, setListMaxHeight] = useState<number>();

  useEffect(() => {
    const updateListMaxHeight = () => {
      const element = listContainerRef.current;
      if (!element) return;

      const top = element.getBoundingClientRect().top;
      const nextMaxHeight = Math.max(180, window.innerHeight - top - 24);
      setListMaxHeight(nextMaxHeight);
    };

    updateListMaxHeight();
    window.addEventListener("resize", updateListMaxHeight);
    return () => window.removeEventListener("resize", updateListMaxHeight);
  }, [folderName, collaborators.length]);

  return (
    <Card className="flex min-h-0 flex-col lg:flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{folderName}</CardTitle>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
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

        <div className="flex min-h-0 flex-col gap-2">
          <div className="text-sm font-medium">コラボレータ一覧</div>

          <div
            ref={listContainerRef}
            className="min-h-0 overflow-y-auto rounded-md border bg-background"
            style={listMaxHeight ? { maxHeight: `${listMaxHeight}px` } : undefined}
          >
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
