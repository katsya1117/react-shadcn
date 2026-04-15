import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/frame/Layout";
import { Folder, Settings, FolderOpen } from "lucide-react";
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
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Center Area
            </p>
            <h1 className="text-2xl font-semibold">センター専用領域</h1>
            <p className="text-sm text-muted-foreground">
              部署やプロジェクト単位で区切られた領域のうち、あなたがアクセスできるものを一覧表示しています。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {areas.map((area) => (
              <Card
                key={area.code}
                className="relative overflow-hidden rounded-lg"
              >
                <CardHeader className="flex flex-col gap-2 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Folder className="h-5 w-5 text-muted-foreground" />
                        <span className="font-mono text-base font-semibold tracking-tight">
                          {area.folderName}
                        </span>
                        {area.isGuest && (
                          <Badge variant="outline">ゲスト</Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {area.label}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  <div className="flex justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() =>
                            navigate(
                              generatePath(UrlPath.SS, {
                                rootFolderId: area.boxFolderId,
                              }),
                            )
                          }
                          aria-label="共有領域管理"
                        >
                          <Settings className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>共有領域管理</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() => openLink(area.jclUrl)}
                          aria-label="Box ブラウザ"
                        >
                          <BoxIcon className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Box ブラウザ</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() =>
                            openLink(
                              `https://app.box.com/folder/${area.boxFolderId}`,
                            )
                          }
                          aria-label="Box Drive"
                        >
                          <FolderOpen className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Box Drive</TooltipContent>
                    </Tooltip>
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
