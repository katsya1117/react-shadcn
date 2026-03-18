import type { SingleValue } from "react-select";
import { Building2, EyeOff, User, UserPlus, X } from "lucide-react";

import type { AutoCompleteData } from "@/api";
import { AutoCompleteSingle } from "@/components/parts/AutoComplete/AutoCompleteSingle";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { ROLE_OPTIONS } from "./constants";
import type { CollaborationListItem, Collaborator, RoleType } from "./types";

type CollaboratorRowProps = {
  item: CollaborationListItem;
  isBusy: boolean;
  onRemove: (collaborator: Collaborator) => void;
};

const CollaboratorRow = ({
  item,
  isBusy,
  onRemove,
}: CollaboratorRowProps) => {
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
            className="h-5 px-1.5 text-xs"
          >
            {ROLE_OPTIONS.find((role) => role.value === collaborator.role)?.label}
          </Badge>
          {!collaborator.canViewPath ? (
            <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          ) : null}
        </div>

        {isInherited && sourcePath ? (
          <div className="truncate pl-6 text-xs text-muted-foreground">
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

export const CollaborationPanel = ({
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
  <Card className="flex min-h-0 flex-col">
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
          >
            <SelectTrigger className="w-full justify-start gap-1 rounded-full border-transparent bg-transparent px-3 text-left shadow-none hover:bg-muted focus-visible:border-transparent focus-visible:ring-0 sm:w-auto">
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

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="text-sm font-medium">コラボレータ一覧</div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/70 bg-background">
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
