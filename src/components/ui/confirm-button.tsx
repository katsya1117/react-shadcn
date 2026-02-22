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
} & React.ComponentPropsWithoutRef<typeof Button>;

export const ConfirmButton = forwardRef<HTMLButtonElement, ConfirmButtonProps>(
  ({ buttonLabel, dialogTitle, dialogBody, onHandle, ...buttonProps }, ref) => {
    const [open, setOpen] = useState(false);

    const handleOk = async () => {
      await onHandle?.();
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button ref={ref} {...buttonProps}>
            {buttonLabel}
          </Button>
        </DialogTrigger>
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
