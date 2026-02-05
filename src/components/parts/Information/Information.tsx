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

// HTMLのbuttonが持つ属性をPropsの型に追加 / Refが重複しないようにWithoutRef
// messageにはテキスト以外が入る可能性もあるのでReactNodeとする

type Props = React.ComponentPropsWithoutRef<"button"> & {
  title?: string;
  message?: React.ReactNode;
  hasNew?: boolean;
};

// forwardRefの型引数は、<Refの型（何のHTML要素にrefを渡すのか）、コンポーネントが受け取るpropsの型>
// 第一引数で使いたいpropsを分割代入、使わない属性も...propsで丸投げし引き継がせる
export const Information = forwardRef<HTMLButtonElement, Props>(
  ({ className, title = "お知らせ", message = "お知らせ一覧", hasNew = false, ...props }, ref) => {
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
          className={cn("relative h-9 w-9 text-muted-foreground hover:text-foreground", className)}
          {...props}
        >
          <Info className="h-5 w-5" />
          {!hasNew && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
            {/* <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span> */}
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
          </span>
          )}
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
