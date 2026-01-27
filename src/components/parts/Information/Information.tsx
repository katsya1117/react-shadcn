import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Props = {
  hasNew?: boolean;
};

/**
 * お知らせアイコン＋モーダル（shadcn版）
 */
export const Information = ({ hasNew = false }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
          aria-label="お知らせを開く"
        >
          <Info size={18} />
          {hasNew && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              New
            </Badge>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>お知らせ</DialogTitle>
          <DialogDescription>最新のお知らせを確認してください。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>お知らせ一覧</p>
          <p className="text-xs">※ 実際のコンテンツをここに差し込んでください。</p>
        </div>
        <div className="flex justify-end pt-3">
          <Button onClick={() => setOpen(false)}>閉じる</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Information;
