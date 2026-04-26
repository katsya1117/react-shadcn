import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Folder, Settings, FolderOpen, Users } from "lucide-react";
import BoxIcon from "@/components/icons/BoxIcon";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { generatePath, useNavigate } from "react-router";
import { UrlPath } from "@/constants/UrlPath";
import { SHARE_AREAS } from "@/config/shareAreaConfig";

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
        <div className="space-y-6">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary/60 font-medium">
              Center Area
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">センター専用領域</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              部署やプロジェクト単位で区切られた領域のうち、あなたがアクセスできるものを一覧表示しています。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {areas.map((area) => (
              <Card
                key={area.code}
                className="group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 py-0 gap-0"
              >
                {/* サブトルなグラデーションオーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <CardContent className="relative p-4">
                  {/* 右上：管理者専用ボタン */}
                  {IS_ADMIN && (
                    <div className="absolute top-3 right-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-muted-foreground/60 opacity-0 transition-all duration-200 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                            aria-label="センターメンバー一覧"
                          >
                            <Users className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>センターメンバー一覧</TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  {/* メインコンテンツ */}
                  <div className="flex items-start gap-3">
                    {/* フォルダアイコン */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10 transition-all duration-300 group-hover:from-primary/15 group-hover:to-primary/10 group-hover:ring-primary/20">
                      <Folder className="h-5 w-5 text-primary/70 transition-colors duration-300 group-hover:text-primary" />
                    </div>
                    
                    {/* テキスト情報 */}
                    <div className="min-w-0 flex-1 space-y-1 pr-8">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold tracking-tight text-foreground truncate">
                          {area.folderName}
                        </span>
                        {area.isGuest && (
                          <Badge 
                            variant="secondary" 
                            className="shrink-0 h-5 px-1.5 text-[10px] font-medium bg-amber-100/80 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400"
                          >
                            ゲスト
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/80 truncate">
                        {area.label}
                      </p>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="mt-4 flex items-center justify-between">
                    {/* 左：コラボレーション設定 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground/70 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-105"
                          onClick={() =>
                            navigate(
                              generatePath(UrlPath.SS, {
                                rootFolderId: area.boxFolderId,
                              }),
                            )
                          }
                          aria-label="コラボレーション設定"
                        >
                          <Settings className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>コラボレーション設定</TooltipContent>
                    </Tooltip>

                    {/* 右：Box操作 */}
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-muted-foreground/70 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-105"
                            onClick={() =>
                              openLink(
                                `https://app.box.com/folder/${area.boxFolderId}`,
                              )
                            }
                            aria-label="Box ブラウザ"
                          >
                            <BoxIcon className="h-4 w-4 aspect-square object-contain" aria-hidden />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Box ブラウザ</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-muted-foreground/70 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-105"
                            onClick={() => openLink(area.jclUrl)}
                            aria-label="Box Drive"
                          >
                            <FolderOpen className="h-4 w-4" aria-hidden />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Box Drive</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default ShareArea;
export { ShareArea };
