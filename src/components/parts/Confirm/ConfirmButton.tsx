import type { ReactNode } from "react";
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { useConfirmState } from "@/hooks/useConfirmState";
import { ConfirmDialog } from "./ConfirmDialog";

type ConfirmButtonProps = {
  buttonLabel: ReactNode;
  dialogTitle: string;
  dialogBody?: ReactNode;
  onHandle: () => void | Promise<unknown>;
} & ButtonProps;

export const ConfirmButton = ({
  buttonLabel,
  dialogTitle,
  dialogBody,
  onHandle,
  ...buttonProps
}: ConfirmButtonProps) => {
  const { isOpen, open, handleOpenChange } = useConfirmState();

  return (
    <>
      <Button {...buttonProps} onClick={open}>
        {buttonLabel}
      </Button>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        dialogTitle={dialogTitle}
        onHandle={onHandle}
      >
        {dialogBody}
      </ConfirmDialog>
    </>
  );
};

ConfirmButton.displayName = "ConfirmButton";
export const ConFirmButton = ConfirmButton;
export default ConfirmButton;
