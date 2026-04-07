import { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Box 公式ロゴ（PNG）をモノクロ化して表示するアイコンコンポーネント。
 * CSS filter で brightness(0) → 黒、dark モードでは invert(1) → 白に変換。
 * lucide-react アイコンと同じサイズ・スタイル規則に従う。
 */
const BoxIcon = ({
  className,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) => (
  <img
    src="/box-logo.png"
    alt=""
    aria-hidden="true"
    className={cn(
      // モノクロ化: brightness(0) で黒、dark モードでは invert で白
      // "brightness-0 dark:invert",
      className,
    )}
    {...props}
  />
);

export default BoxIcon;
