import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/frame/Layout";
import { Folder, Monitor, Box, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { generatePath, useNavigate } from "react-router";
import { UrlPath } from "@/constant/UrlPath";

type Area = {
  code: string;
  folderName: string;
  label: string;
  isGuest?: boolean;
  jclUrl: string;
  boxFolderId: string;
};

const initialAreas: Area[] = [
  {
    code: "qms",
    folderName: "qms",
    label: "QMS事務局",
    jclUrl: "/launch/qms/jcl",
    boxFolderId: "370613768434",
  },
  {
    code: "ems",
    folderName: "ems",
    label: "EMS事務局",
    jclUrl: "/launch/ems/jcl",
    boxFolderId: "370615717715",
  },
  {
    code: "tg-room",
    folderName: "tg-room",
    label: "統合サーバー",
    isGuest: true,
    jclUrl: "/launch/tg-room/jcl",
    boxFolderId: "370616229381",
  },
  {
    code: "jclgd1swdv",
    folderName: "JCLGD1SWDV",
    label: "第1ソフトウェア開発センター",
    jclUrl: "/launch/JCLGD1SWDV/jcl",
    boxFolderId: "370616229381",
  },
];

const ShareArea = () => {
  const areas = initialAreas;
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-10 gap-2 rounded-full px-4"
                          onClick={() =>
                            navigate(
                              generatePath(UrlPath.SS, {
                                folderId: area.boxFolderId,
                              }),
                            )
                          }
                          aria-label="共有領域管理"
                        >
                          <Settings className="h-4 w-4" aria-hidden />
                          <span>共有領域管理</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>共有領域管理</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full hover:bg-muted"
                          onClick={() => openLink(area.jclUrl)}
                          aria-label="JCLで開く"
                        >
                          <Monitor className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>JCLで開く</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full hover:bg-muted"
                          onClick={() =>
                            openLink(
                              `https://app.box.com/folder/${area.boxFolderId}`,
                            )
                          }
                          aria-label="BOXで開く"
                        >
                          <Box className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>BOXで開く</TooltipContent>
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
