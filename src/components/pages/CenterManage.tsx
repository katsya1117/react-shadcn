import { useMemo, useState } from "react";
import Layout from "@/components/frame/Layout";
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
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Center = {
  name: string;
  members: number;
  type: "所属" | "カスタマイズ";
  site: string;
};

const centersMock: Center[] = [
  { name: "東京センター", members: 32, type: "所属", site: "横浜" },
  { name: "大阪DR", members: 12, type: "所属", site: "中部" },
  { name: "監査チーム", members: 6, type: "カスタマイズ", site: "横浜" },
];

const CenterManage = () => {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<Center | null>(null);

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
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">センター設定</h1>
          <p className="text-sm text-muted-foreground">
            新規センター登録と既存センターの編集をシングルページで。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>新規センター登録</CardTitle>
            <CardDescription>未定義センターをJCLに追加します。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>センター名</Label>
              <Input placeholder="例: 名古屋センター" />
              <Label>展開先</Label>
              <Input placeholder="パスや拠点名" />
            </div>
            <div className="space-y-3">
              <div>
                <Label>拠点</Label>
                <div className="flex gap-3 pt-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="site" defaultChecked /> 横浜
                  </Label>
                  <Label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="site" /> 中部
                  </Label>
                </div>
              </div>
              <div>
                <Label>タイプ</Label>
                <div className="flex gap-3 pt-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="ctype" defaultChecked /> 所属
                  </Label>
                  <Label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="ctype" /> カスタマイズ
                  </Label>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button>登録</Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <Button className="w-full">検索</Button>
              </div>
            </div>

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
                {filtered.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.members}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.type}</Badge>
                    </TableCell>
                    <TableCell>{c.site}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary" onClick={() => setSelected(c)}>
                        選択
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>センター詳細</CardTitle>
            <CardDescription>選択したセンターのメンバーと詳細設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>センター名</Label>
                <Input readOnly value={selected?.name ?? ""} />
              </div>
              <div>
                <Label>タイプ</Label>
                <Input readOnly value={selected?.type ?? ""} />
              </div>
              <div>
                <Label>展開先</Label>
                <Input readOnly value={selected?.site ?? ""} />
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">メンバー</p>
                  <p className="text-xs text-muted-foreground">
                    ゲスト追加や管理者切替を行えます。
                  </p>
                </div>
                <Button size="sm" variant="secondary">
                  ゲスト追加
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>管理者</TableHead>
                    <TableHead>ゲスト</TableHead>
                    <TableHead>センター</TableHead>
                    <TableHead>ユーザーID</TableHead>
                    <TableHead>ユーザー名</TableHead>
                    <TableHead>権限</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Switch defaultChecked />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">所属</Badge>
                    </TableCell>
                    <TableCell>{selected?.name ?? "-"}</TableCell>
                    <TableCell>u001</TableCell>
                    <TableCell>佐藤 健</TableCell>
                    <TableCell>標準</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Switch />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">ゲスト</Badge>
                    </TableCell>
                    <TableCell>大阪DR</TableCell>
                    <TableCell>u099</TableCell>
                    <TableCell>Guest User</TableCell>
                    <TableCell>閲覧のみ</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        ゲスト削除
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">詳細情報</p>
                <p className="text-xs text-muted-foreground">容量や比率の設定。</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>割り当て容量 (Kb)</Label>
                  <Input placeholder="例: 1048576" />
                  <p className="text-xs text-muted-foreground">xTb 換算: 1.0 TB</p>
                </div>
                <div className="space-y-1">
                  <Label>全体使用量 (Kb)</Label>
                  <Input placeholder="例: 512000" />
                  <p className="text-xs text-muted-foreground">X.X Mb 換算: 512 Mb</p>
                </div>
                <div className="space-y-1">
                  <Label>共有領域使用量 (Kb)</Label>
                  <Input placeholder="例: 256000" />
                  <p className="text-xs text-muted-foreground">x.x Mb</p>
                </div>
                <div className="space-y-1">
                  <Label>JOB比率 (%)</Label>
                  <Input placeholder="整数のみ" />
                  <p className="text-xs text-muted-foreground">JOB領域側の比率</p>
                </div>
                <div className="space-y-1">
                  <Label>使用率 (%)</Label>
                  <Input placeholder="例: 45" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>保存</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CenterManage;
export { CenterManage };
