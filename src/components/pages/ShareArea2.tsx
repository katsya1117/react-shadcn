import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/frame/Layout";
import { Folder, Settings, FolderOpen, Users, Search, MoreHorizontal } from "lucide-react";
import BoxIcon from "@/components/icons/BoxIcon";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { generatePath, useNavigate } from "react-router";
import { UrlPath } from "@/constant/UrlPath";
import { SHARE_AREAS } from "./shareAreaConfig";
import { useState, useMemo } from "react";

/** モック用フラグ。将来的にはセッションのロールから取得する */
const IS_ADMIN = true;

const ShareArea2 = () => {
  const areas = SHARE_AREAS;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;
    const query = searchQuery.toLowerCase();
    return areas.filter(
      (area) =>
        area.folderName.toLowerCase().includes(query) ||
        area.label.toLowerCase().includes(query)
    );
  }, [areas, searchQuery]);

  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Layout>
        <div className="space-y-4">
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

          {/* リスト */}
          <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
            {/* リストアイテム */}
            <div className="divide-y divide-border/40">
              {filteredAreas.map((area) => (
                <div
                  key={area.code}
                  className="group relative flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/40"
                >
                  {/* フォルダアイコン */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-150 group-hover:bg-primary/15">
                    <Folder className="h-4 w-4 text-primary/70 transition-colors duration-150 group-hover:text-primary" />
                  </div>

                  {/* フォルダ情報：中央で伸張 */}
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

                  {/* 右端：開く系ボタン + 設定メニュー */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() =>
                            openLink(
                              `https://app.box.com/folder/${area.boxFolderId}`
                            )
                          }
                          aria-label="Box ブラウザ"
                        >
                          <BoxIcon
                            className="h-4 w-4 aspect-square object-contain"
                            aria-hidden
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Box ブラウザ</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() => openLink(area.jclUrl)}
                          aria-label="Box Drive"
                        >
                          <FolderOpen className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Box Drive</TooltipContent>
                    </Tooltip>

                    {/* 設定メニュー */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
                          aria-label="その他の操作"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              generatePath(UrlPath.SS, {
                                rootFolderId: area.boxFolderId,
                              })
                            )
                          }
                        >
                          <Settings className="h-4 w-4 mr-2" aria-hidden />
                          コラボレーション設定
                        </DropdownMenuItem>
                        {IS_ADMIN && (
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" aria-hidden />
                            センターメンバー一覧
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
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
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default ShareArea2;
export { ShareArea2 };
