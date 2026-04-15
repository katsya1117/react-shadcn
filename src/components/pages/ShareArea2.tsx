import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/frame/Layout";
import { Folder, Settings, FolderOpen, Users, Search } from "lucide-react";
import BoxIcon from "@/components/icons/BoxIcon";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { generatePath, useNavigate } from "react-router";
import { UrlPath } from "@/constant/UrlPath";
import { SHARE_AREAS } from "./shareAreaConfig";
import { useState, useMemo } from "react";

/** モック: 自分が所属するセンターコード。将来はセッションから取得 */
const MY_CENTER_CODE = "jclgd1swdv";
/** モック: 管理者フラグ */
const IS_ADMIN = true;

const ShareArea2 = () => {
  const areas = SHARE_AREAS;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAreas = useMemo(() => {
    let result = areas;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = areas.filter(
        (area) =>
          area.folderName.toLowerCase().includes(query) ||
          area.label.toLowerCase().includes(query)
      );
    }
    // 自部署を常に一番上に
    return [...result].sort((a, b) => {
      if (a.code === MY_CENTER_CODE) return -1;
      if (b.code === MY_CENTER_CODE) return 1;
      return 0;
    });
  }, [areas, searchQuery]);

  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Layout>
        <div className="space-y-8">
          {/* ヘッダー */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary/60 font-medium">
                Center Area
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                センター専用領域
              </h1>
              <p className="text-sm text-muted-foreground">
                アクセス可能な共有領域 ({filteredAreas.length}件)
              </p>
            </div>

            {/* 検索 */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="text"
                placeholder="領域を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/30 border-border/50 focus:bg-background"
              />
            </div>
          </div>

          {/* グリッド */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredAreas.map((area) => {
              const isOwnCenter = area.code === MY_CENTER_CODE;
              return (
                <div
                  key={area.code}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-4 transition-all duration-200 hover:border-border hover:bg-card/60 hover:shadow-sm"
                >
                  {/* 上部：フォルダ情報 */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Folder className="h-4 w-4 text-primary/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground truncate">
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
                      <p className="text-xs text-muted-foreground truncate">
                        {area.label}
                      </p>
                    </div>
                  </div>

                  {/* 下部：アクションボタン */}
                  <div className="flex flex-wrap gap-2 border-t border-border/30 pt-3">
                    {/* 開く系ボタン */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 rounded-full border-primary/30 text-primary/70 hover:border-primary hover:bg-primary/10 hover:text-primary text-xs"
                          onClick={() =>
                            openLink(
                              `https://app.box.com/folder/${area.boxFolderId}`
                            )
                          }
                        >
                          <BoxIcon className="h-3 w-3 aspect-square object-contain" aria-hidden />
                          Box ブラウザ
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Box ブラウザで開く</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 rounded-full border-primary/30 text-primary/70 hover:border-primary hover:bg-primary/10 hover:text-primary text-xs"
                          onClick={() => openLink(area.jclUrl)}
                        >
                          <FolderOpen className="h-3 w-3" aria-hidden />
                          Box Drive
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Box Driveで開く</TooltipContent>
                    </Tooltip>

                    {/* 管理系ボタン（自部署のみ） */}
                    {isOwnCenter && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 rounded-full border-primary/30 text-primary/70 hover:border-primary hover:bg-primary/10 hover:text-primary text-xs"
                              onClick={() =>
                                navigate(
                                  generatePath(UrlPath.SS, {
                                    rootFolderId: area.boxFolderId,
                                  })
                                )
                              }
                            >
                              <Settings className="h-3 w-3" aria-hidden />
                              設定
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>コラボレーション設定</TooltipContent>
                        </Tooltip>

                        {IS_ADMIN && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1.5 rounded-full border-primary/30 text-primary/70 hover:border-primary hover:bg-primary/10 hover:text-primary text-xs"
                              >
                                <Users className="h-3 w-3" aria-hidden />
                                メンバー
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>センターメンバー一覧</TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 空状態 */}
          {filteredAreas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Folder className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                該当する領域が見つかりません
              </p>
            </div>
          )}
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default ShareArea2;
export { ShareArea2 };
