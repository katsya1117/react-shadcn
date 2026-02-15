import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CenterTabsShell } from "@/components/pages/CenterTabsShell";
import { useNavigate } from "react-router";
import { UrlPath } from "@/constant/UrlPath";

type Center = {
  code: string;
  name: string;
  members: number;
  type: "所属" | "カスタマイズ";
  site: string;
};

const centersMock: Center[] = [
  { code: "c001", name: "東京センター", members: 32, type: "所属", site: "横浜" },
  { code: "c002", name: "大阪DR", members: 12, type: "所属", site: "中部" },
  { code: "c003", name: "監査チーム", members: 6, type: "カスタマイズ", site: "横浜" },
];

const CenterManage = () => {
  const [keyword, setKeyword] = useState("");
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(
    () =>
      centersMock.filter(
        (c) =>
          c.name.includes(keyword) ||
          c.site.includes(keyword) ||
          String(c.members).includes(keyword),
      ),
    [keyword],
  );

  return (
    <CenterTabsShell active="edit">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>センター検索 / 編集</CardTitle>
            <CardDescription>センター名またはメンバー逆引きで検索し、選択して編集。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
              <div className="space-y-2">
                <Label>センター名</Label>
                <Input
                  placeholder="例: 東京センター"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>メンバー</Label>
                <Input placeholder="ユーザー名で逆引き" />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={() => setSearched(true)}>
                  検索
                </Button>
              </div>
            </div>

            {searched ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>センター名</TableHead>
                    <TableHead>メンバー数</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>拠点</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                        該当するセンターが見つかりませんでした。
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.members}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.type}</Badge>
                      </TableCell>
                      <TableCell>{c.site}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            navigate(UrlPath.CenterEdit.replace(":center_cd", c.code))
                          }
                        >
                          選択
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                「検索」ボタンを押すと結果が表示されます。
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CenterTabsShell>
  );
};

export default CenterManage;
export { CenterManage };
