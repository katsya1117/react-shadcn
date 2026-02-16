import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import Layout from "@/components/frame/Layout";
import { Folder, Monitor, Box } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type Area = {
  code: string;
  folderName: string;
  label: string;
  isGuest?: boolean;
  mounted: boolean;
  jclUrl: string;
  boxUrl: string;
};

const initialAreas: Area[] = [
  {
    code: "qms",
    folderName: "qms",
    label: "QMS事務局",
    mounted: true,
    jclUrl: "/launch/qms/jcl",
    boxUrl: "https://app.box.com/folder/qms",
  },
  {
    code: "ems",
    folderName: "ems",
    label: "EMS事務局",
    mounted: false,
    jclUrl: "/launch/ems/jcl",
    boxUrl: "https://app.box.com/folder/ems",
  },
  {
    code: "tg-room",
    folderName: "tg-room",
    label: "統合サーバー",
    mounted: true,
    isGuest: true,
    jclUrl: "/launch/tg-room/jcl",
    boxUrl: "https://app.box.com/folder/tg-room",
  },
  {
    code: "jclgd1swdv",
    folderName: "JCLGD1SWDV",
    label: "第1ソフトウェア開発センター",
    mounted: false,
    jclUrl: "/launch/JCLGD1SWDV/jcl",
    boxUrl: "https://app.box.com/folder/JCLGD1SWDV",
  },
];

const ShareArea = () => {
  const [areas, setAreas] = useState<Area[]>(initialAreas);

  const toggleMount = (code: string) => {
    setAreas((prev) =>
      prev.map((a) => (a.code === code ? { ...a, mounted: !a.mounted } : a))
    );
    const target = areas.find((a) => a.code === code);
    if (target) {
      toast(`${target.label} を${target.mounted ? "アンマウント" : "マウント"}しました`);
    }
  };

  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Layout>
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Center Area</p>
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
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${area.mounted ? "bg-emerald-500" : "bg-border"}`}
                />
                <CardHeader className="flex flex-col gap-2 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Folder className="h-5 w-5 text-muted-foreground" />
                        <span className="font-mono text-base font-semibold tracking-tight">
                          {area.folderName}
                        </span>
                        {area.isGuest && <Badge variant="outline">ゲスト</Badge>}
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {area.label}
                      </CardTitle>
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      <Badge variant={area.mounted ? "secondary" : "outline"}>
                        {area.mounted ? "マウント中" : "マウント"}
                      </Badge>
                      <Switch
                        checked={area.mounted}
                        onChange={() => toggleMount(area.code)}
                        aria-label="マウント切替"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  <div className="flex justify-end gap-2">
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
                          onClick={() => openLink(area.boxUrl)}
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
