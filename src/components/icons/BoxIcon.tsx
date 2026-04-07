import { SVGProps } from "react";

/**
 * Box 公式ロゴを模したモノクロ SVG アイコン。
 * lucide-react アイコンと同じサイズ・スタイル規則に従う。
 */
const BoxIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    {/*
      Box 公式ロゴの構成:
      - 左: 小さい正方形（小フォルダ）
      - 右: 大きい正方形（メインストレージ）
      モノクロ・currentColor で周囲アイコンと統一。
    */}
    <rect x="1.5" y="9.5" width="5" height="5" rx="0.75" />
    <rect x="8.5" y="4.5" width="14" height="15" rx="1.25" />
  </svg>
);

export default BoxIcon;
