import { forwardRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";

type ConfirmButtonProps = {
  buttonLabel: ReactNode;
  dialogTitle: ReactNode;
  dialogBody?: ReactNode;
  onHandle?: () => void | Promise<unknown>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
} & React.ComponentPropsWithoutRef<typeof Button>;

export const ConfirmButton = forwardRef<HTMLButtonElement, ConfirmButtonProps>(
  (
    {
      buttonLabel,
      dialogTitle,
      dialogBody,
      onHandle,
      open: openProp,
      onOpenChange,
      hideTrigger,
      ...buttonProps
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = openProp ?? internalOpen;
    const setOpen = (next: boolean) => {
      if (openProp === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    };

    const handleOk = async () => {
      await onHandle?.();
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {!hideTrigger ? (
          <DialogTrigger asChild>
            <Button ref={ref} {...buttonProps}>
              {buttonLabel}
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            {dialogBody && <DialogDescription>{dialogBody}</DialogDescription>}
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">キャンセル</Button>
            </DialogClose>
            <Button onClick={handleOk}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

ConfirmButton.displayName = "ConfirmButton";

// 大文字小文字ゆらぎに対応するエイリアス
export const ConFirmButton = ConfirmButton;

export default ConfirmButton;
