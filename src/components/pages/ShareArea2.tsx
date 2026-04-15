import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/frame/Layout";
import { Folder, FolderOpen, Users, Search, UserPlus } from "lucide-react";
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
        <div className="max-w-2xl space-y-8">
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

          {/* リスト：Vercel Storage風アイランド */}
          <div className="space-y-2">
            {filteredAreas.map((area) => {
              const isOwnCenter = area.code === MY_CENTER_CODE;
              return (
                <div
                  key={area.code}
                  className="overflow-hidden rounded-xl border border-border/60 bg-card/50 transition-colors duration-150 hover:border-border hover:bg-card/70"
                >
                  {/* 1行目：フォルダ情報 + 開く系ボタン */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Folder className="h-4 w-4 text-primary/70" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-sm font-semibold">
                          {area.folderName}
                        </span>
                        {area.isGuest && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 h-5 px-1.5 text-[10px] bg-amber-100/80 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400"
                          >
                            ゲスト
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {area.label}
                      </p>
                    </div>

                    {/* 開く系ボタン（アイコンのみ・角丸outline） */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 rounded-lg p-1 border-border/40 text-muted-foreground hover:border-border/70 hover:bg-muted/60 hover:text-foreground"
                            onClick={() => openLink(`https://app.box.com/folder/${area.boxFolderId}`)}
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
                            variant="outline"
                            className="h-7 w-7 rounded-lg p-1 border-border/40 text-muted-foreground hover:border-border/70 hover:bg-muted/60 hover:text-foreground"
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

                  {/* 2行目：管理系ボタン（自部署のみ） */}
                  {isOwnCenter && (
                    <div className="flex items-center justify-between border-t border-border/30 px-4 py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 rounded-full text-xs border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground hover:bg-muted/30"
                        onClick={() =>
                          navigate(generatePath(UrlPath.SS, { rootFolderId: area.boxFolderId }))
                        }
                      >
                        <UserPlus className="h-3.5 w-3.5" aria-hidden />
                        コラボレーション設定
                      </Button>

                      {IS_ADMIN && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              aria-label="センターメンバー一覧"
                            >
                              <Users className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>センターメンバー一覧</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 空状態 */}
          {filteredAreas.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card/50 py-12 text-center">
              <Folder className="mb-3 h-10 w-10 text-muted-foreground/30" />
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
