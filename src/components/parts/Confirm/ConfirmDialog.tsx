import type { ComponentProps } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Dialog> & {
  dialogTitle?: string;
  onHandle?: () => void | Promise<unknown>;
  className?: string;
};

export const ConfirmDialog = ({
  dialogTitle,
  onHandle,
  children,
  open,
  onOpenChange,
  className,
}: Props) => {
  const handleOk = async () => {
    await onHandle?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(className)}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground">
          {children}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            キャンセル
          </Button>
          <Button onClick={handleOk}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConfirmDialog.displayName = "ConfirmDialog";
