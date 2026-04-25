import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CenterTabsShell } from "@/components/pages/CenterTabsShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, List, ShieldCheck } from "lucide-react";
import { UrlPath } from "@/constant/UrlPath";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ConfirmButton } from "@/components/parts/Confirm/ConfirmButton";
import { toast } from "@/components/ui/sonner";

const centersMock = [
  { code: "c001", name: "東京センター", type: "所属", site: "横浜" },
  { code: "c002", name: "大阪DR", type: "所属", site: "中部" },
  { code: "c003", name: "監査チーム", type: "カスタマイズ", site: "横浜" },
];

type Member = {
  id: string;
  name: string;
  role: string;
  isAdmin: boolean;
  guestLabel: "所属" | "ゲスト";
};

const CenterEdit = () => {
  const { center_cd } = useParams<{ center_cd: string }>();
  const navigate = useNavigate();

  const center = useMemo(() => centersMock.find((c) => c.code === center_cd), [center_cd]);
  const [members, setMembers] = useState<Member[]>([
    { id: "u001", name: "佐藤 健",     role: "標準",   isAdmin: true,  guestLabel: "所属" },
    { id: "u002", name: "田中 美咲",   role: "標準",   isAdmin: false, guestLabel: "所属" },
    { id: "u003", name: "鈴木 大輔",   role: "標準",   isAdmin: false, guestLabel: "所属" },
    { id: "u004", name: "山本 花子",   role: "閲覧のみ", isAdmin: false, guestLabel: "所属" },
    { id: "u005", name: "中村 翔",     role: "標準",   isAdmin: false, guestLabel: "所属" },
    { id: "u006", name: "伊藤 恵子",   role: "標準",   isAdmin: false, guestLabel: "所属" },
    { id: "u099", name: "外部 太郎",   role: "閲覧のみ", isAdmin: false, guestLabel: "ゲスト" },
    { id: "u100", name: "Guest A",     role: "閲覧のみ", isAdmin: false, guestLabel: "ゲスト" },
    { id: "u101", name: "Guest B",     role: "閲覧のみ", isAdmin: false, guestLabel: "ゲスト" },
    { id: "u102", name: "Guest C",     role: "閲覧のみ", isAdmin: false, guestLabel: "ゲスト" },
  ]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("閲覧のみ");

  return (
    <CenterTabsShell active="edit">
      <div className="space-y-4">
        {/* ヘッダー情報（枠なし） */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-full px-3"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Center Edit</p>
              <p className="text-2xl font-semibold">{center?.name ?? "センター編集"}</p>
            </div>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-3"
                onClick={() => navigate(UrlPath.CenterManage)}
              >
                <List className="h-4 w-4" />
                センター一覧へ戻る
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">センターコード: {center?.code ?? center_cd ?? "-"}</Badge>
            {center?.site && (
              <span className="rounded-full bg-muted px-3 py-1 text-foreground/70">拠点 {center.site}</span>
            )}
          </div>
        </div>

        {/* カードは縦並び */}
        {/* 基本設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">基本設定</CardTitle>
            <CardDescription>センターの基本情報を確認・編集します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                <Label>センターコード</Label>
                <Input readOnly value={center?.code ?? center_cd ?? ""} />
              </div>
              <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                <Label>センター名</Label>
                <Input defaultValue={center?.name ?? ""} />
              </div>
              <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                <Label>タイプ</Label>
                <Input defaultValue={center?.type ?? ""} />
              </div>
              <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                <Label>拠点</Label>
                <Input defaultValue={center?.site ?? ""} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm">保存</Button>
            </div>
          </CardContent>
        </Card>

        {/* 詳細情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">詳細情報（容量・比率）</CardTitle>
            <CardDescription>容量や比率を設定します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {[
                { label: "割り当て容量 (Kb)", hint: "xTb 換算: 1.0 TB" },
                { label: "全体使用量 (Kb)", hint: "X.X Mb 換算: 512 Mb" },
                { label: "共有領域使用量 (Kb)", hint: "x.x Mb" },
                { label: "JOB比率 (%)", hint: "JOB領域側の比率" },
                { label: "使用率 (%)", hint: "" },
              ].map((item) => (
                <div key={item.label} className="space-y-1 w-full md:w-[calc(50%-8px)]">
                  <Label>{item.label}</Label>
                  <Input placeholder="数値のみ" />
                  {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button size="sm">保存</Button>
            </div>
          </CardContent>
        </Card>

        {/* メンバー */}
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-lg">メンバー</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  管理者：
                  {members.filter((m) => m.isAdmin).map((m) => m.guestLabel === "ゲスト" ? `${m.name}（ゲスト）` : m.name).join("、") || "未設定"}
                </span>
              </div>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="secondary">
                  ゲスト追加
                </Button>
              </SheetTrigger>
              <SheetContent className="px-4 sm:px-8">
                <SheetHeader>
                  <SheetTitle>ゲスト追加</SheetTitle>
                  <SheetDescription>このセンターに新しいメンバーを招待します。</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1">
                    <Label>ユーザーID</Label>
                    <Input
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      placeholder="例: u123"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>表示名</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="氏名"
                    />
                  </div>
                </div>
                <SheetFooter className="mt-6">
                  <SheetClose asChild>
                    <Button
                      disabled={!newUserId || !newName}
                      onClick={() => {
                        setMembers((prev) => [
                          ...prev,
                          {
                            id: newUserId,
                            name: newName,
                            role: "閲覧のみ",
                            isAdmin: false,
                            guestLabel: "ゲスト",
                          },
                        ]);
                        toast(`${newName} を追加しました`);
                        setNewUserId("");
                        setNewName("");
                        setNewRole("閲覧のみ");
                      }}
                    >
                      追加
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </CardHeader>

          <CardContent className="space-y-3">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">ユーザーID</TableHead>
                  <TableHead className="w-[38%]">ユーザー名</TableHead>
                  <TableHead className="w-[16%]">権限</TableHead>
                  <TableHead className="w-[14%]">管理者</TableHead>
                  <TableHead className="w-[14%] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground text-sm truncate">{m.id}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{m.name}</span>
                        {m.guestLabel === "ゲスト" && (
                          <Badge variant="outline" className="text-xs shrink-0">ゲスト</Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{m.role}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={m.isAdmin}
                        onCheckedChange={(checked) =>
                          setMembers((prev) =>
                            prev.map((p) => p.id === m.id ? { ...p, isAdmin: !!checked } : p)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {m.guestLabel === "ゲスト" && (
                        <ConfirmButton
                          size="sm"
                          variant="ghost"
                          buttonLabel="削除"
                          dialogTitle="削除しますか？"
                          dialogBody={
                            <>{m.name} をこのセンターから削除します。この操作は元に戻せません。</>
                          }
                          onHandle={async () => {
                            setMembers((prev) => prev.filter((p) => p.id !== m.id));
                            toast(`${m.name} を削除しました`);
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* センター削除 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-destructive">センター削除</CardTitle>
            <CardDescription>このセンターを削除すると元に戻せません。</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmButton
              variant="destructive"
              buttonLabel="削除する"
              dialogTitle="本当に削除しますか？"
              dialogBody={
                <>{center?.name ?? "このセンター"} を削除します。この操作は取り消せません。</>
              }
              onHandle={async () => {
                toast(`${center?.name ?? "センター"} を削除しました`);
                navigate(UrlPath.CenterManage);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </CenterTabsShell>
  );
};

export default CenterEdit;
export { CenterEdit };
