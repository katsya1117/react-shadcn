import { forwardRef, useState } from "react";
import { Tag } from "lucide-react";
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
  version?: string;
  details?: React.ReactNode;
};

export const VersionInfo = forwardRef<HTMLButtonElement, Props>(
  ({ className, version = "v0.0.0", details, ...props }, ref) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button
          ref={ref}
          type="button"
          variant="ghost"
          size="icon"
          aria-label="バージョン情報"
          onClick={() => setOpen(true)}
          className={cn("h-9 w-9 text-muted-foreground hover:text-foreground", className)}
          {...props}
        >
          <Tag className="h-5 w-5" />
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>バージョン情報</DialogTitle>
              <DialogDescription>現在のリリース番号</DialogDescription>
            </DialogHeader>
            <div className="space-y-1 text-sm text-foreground">
              <p>アプリケーション: {version}</p>
              {details ?? <p>リリース日やビルド情報をここに表示します。</p>}
            </div>
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
VersionInfo.displayName = "VersionInfo";
