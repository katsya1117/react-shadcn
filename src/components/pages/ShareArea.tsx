import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/frame/Layout";
import { Folder, Settings, FolderOpen, Users } from "lucide-react";
import BoxIcon from "@/components/icons/BoxIcon";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { generatePath, useNavigate } from "react-router";
import { UrlPath } from "@/constant/UrlPath";
import { SHARE_AREAS } from "./shareAreaConfig";

/** モック用フラグ。将来的にはセッションのロールから取得する */
const IS_ADMIN = true;

const ShareArea = () => {
  const areas = SHARE_AREAS;
  const navigate = useNavigate();

  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Layout>
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Center Area
            </p>
            <h1 className="text-2xl font-semibold">センター専用領域</h1>
            <p className="text-sm text-muted-foreground">
              部署やプロジェクト単位で区切られた領域のうち、あなたがアクセスできるものを一覧表示しています。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {areas.map((area) => (
              <div
                key={area.code}
                className="relative flex flex-col justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* 右上：管理者専用ボタン（モック） */}
                <div className="absolute top-2 right-2">
                  {IS_ADMIN && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          aria-label="センターメンバー一覧"
                        >
                          <Users className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>センターメンバー一覧</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* メイン情報 */}
                <div className="flex items-start gap-3 pr-6">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-semibold tracking-tight text-foreground truncate">
                        {area.folderName}
                      </span>
                      {area.isGuest && (
                        <Badge variant="outline" className="text-xs py-0 px-1.5 h-4 shrink-0">
                          ゲスト
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {area.label}
                    </p>
                  </div>
                </div>

                {/* フッター：左にコラボレーション設定、右にBox操作 */}
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        onClick={() =>
                          navigate(
                            generatePath(UrlPath.SS, {
                              rootFolderId: area.boxFolderId,
                            }),
                          )
                        }
                        aria-label="コラボレーション設定"
                      >
                        <Settings className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>コラボレーション設定</TooltipContent>
                  </Tooltip>

                  <div className="flex items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() => openLink(area.jclUrl)}
                          aria-label="Box ブラウザ"
                        >
                          <BoxIcon className="h-3.5 w-3.5 aspect-square object-contain" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Box ブラウザ</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() =>
                            openLink(
                              `https://app.box.com/folder/${area.boxFolderId}`,
                            )
                          }
                          aria-label="Box Drive"
                        >
                          <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Box Drive</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default ShareArea;
export { ShareArea };
