import { useCallback, useState } from "react";

export const useConfirmState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setIsOpen(nextOpen);
  }, []);

  return {
    isOpen,
    open,
    close,
    handleOpenChange,
  };
};
