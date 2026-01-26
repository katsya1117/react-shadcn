import { Tag } from "lucide-react";

type Props = {
  href?: string;
  version?: string;
};

/**
 * ビルドやリリース番号を表示するアイコンリンク。
 */
export const VersionInfo = ({ href = "https://example.com/release-notes", version = "v0.0.0" }: Props) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
      aria-label="Version info"
      title={`Version: ${version}`}
    >
      <Tag size={18} />
    </a>
  );
};

export default VersionInfo;
