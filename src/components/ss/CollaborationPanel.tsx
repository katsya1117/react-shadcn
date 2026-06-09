import type { SingleValue } from "react-select";
import { UserPlus } from "lucide-react";

import type { AutoCompleteData } from "@/api";
import { AutoCompleteSingle } from "@/components/common/AutoComplete/AutoCompleteSingle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { ROLE_OPTIONS } from "@/constants/ssConstants";
import type { CollaborationListItem, Collaborator, RoleType } from "@/types/ss";
import { ConfirmButton } from "../common/Confirm/ConfirmButton";
import {
  CollaboratorRow,
  CollaboratorRowSkeleton,
  getRoleLabel,
} from "@/components/ss/CollaboratorRow";

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
