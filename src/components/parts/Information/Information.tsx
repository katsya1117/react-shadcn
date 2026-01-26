import { Info, LifeBuoy } from "lucide-react";

type Props = {
  href?: string;
  icon?: "info" | "help";
};

/**
 * Topメニュー用の情報アイコン。クリックで指定先へ移動。
 */
export const Information = ({
  href = "https://example.com/info",
  icon = "info",
}: Props) => {
  const Icon = icon === "help" ? LifeBuoy : Info;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
      aria-label="Information"
    >
      <Icon size={18} />
    </a>
  );
};

export default Information;
