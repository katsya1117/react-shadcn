import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** 親要素（relative）の上に半透明レイヤーを被せてスピナーを表示する。 */
export const LoadingOverlay = ({ className }: Props) => (
  <div
    className={cn(
      "absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/60 backdrop-blur-[1px]",
      className,
    )}
  >
    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
  </div>
);
