import { forwardRef, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = React.ComponentPropsWithoutRef<"button"> & {
  title?: string;
  message?: React.ReactNode;
};

export const Information = forwardRef<HTMLButtonElement, Props>(
  ({ className, title = "お知らせ", message = "お知らせ一覧", ...props }, ref) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button
          ref={ref}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={title}
          onClick={() => setOpen(true)}
          className={cn("h-9 w-9 text-muted-foreground hover:text-foreground", className)}
          {...props}
        >
          <Info className="h-5 w-5" />
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>最新のお知らせを確認できます。</DialogDescription>
            </DialogHeader>
            <div className="text-sm text-foreground">{message}</div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);
Information.displayName = "Information";
