import { useMemo, useState } from "react";
import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Area = {
  name: string;
  folder: string;
  guest: boolean;
  viewUrl: string;
  mounted: boolean;
};

const mockAreas: Area[] = [
  {
    name: "東京センター",
    folder: "/centers/tokyo",
    guest: false,
    viewUrl: "/centers/tokyo",
    mounted: true,
  },
  {
    name: "大阪 DR",
    folder: "/centers/osaka-dr",
    guest: true,
    viewUrl: "/centers/osaka-dr",
    mounted: false,
  },
  {
    name: "検証環境",
    folder: "/labs/validation",
    guest: false,
    viewUrl: "/labs/validation",
    mounted: false,
  },
];

const CenterArea = () => {
  const [areas, setAreas] = useState<Area[]>(mockAreas);

  const sorted = useMemo(
    () =>
      [...areas].sort((a, b) =>
        a.guest === b.guest
          ? a.name.localeCompare(b.name)
          : Number(a.guest) - Number(b.guest),
      ),
    [areas],
  );

  const toggleMount = (folder: string) => {
    setAreas((prev) =>
      prev.map((a) =>
        a.folder === folder ? { ...a, mounted: !a.mounted } : a,
      ),
    );
  };

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">センター専用領域</CardTitle>
          <CardDescription>権限を持つ領域のみ表示します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">領域名</th>
                  <th className="px-3 py-2 text-left">フォルダー名</th>
                  <th className="px-3 py-2 text-left">ゲスト</th>
                  <th className="px-3 py-2 text-left">閲覧</th>
                  <th className="px-3 py-2 text-left">マウント</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((area) => (
                  <tr key={area.folder} className="bg-background">
                    <td className="px-3 py-2 font-medium">{area.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {area.folder}
                    </td>
                    <td className="px-3 py-2">
                      {area.guest ? (
                        <Badge variant="secondary">ゲスト</Badge>
                      ) : (
                        <Badge variant="outline">メンバー</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Button asChild variant="ghost" size="sm">
                        <a href={area.viewUrl} target="_blank" rel="noreferrer">
                          開く
                        </a>
                      </Button>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant={area.mounted ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleMount(area.folder)}
                      >
                        {area.mounted ? "マウント済" : "マウント"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default CenterArea;
