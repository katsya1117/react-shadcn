import { useParams, useNavigate } from "react-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { ArrowLeft, List, Check, X } from "lucide-react";
import { UserTabsShell } from "@/components/pages/UserTabsShell";
import { UrlPath } from "@/constant/UrlPath";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

const permissionTemplates = ["標準", "閲覧のみ", "管理者", "運用", "監査"];

const UserEdit = () => {
  const { user_cd } = useParams();
  const navigate = useNavigate();

  // ここではモック値。実際は API や Redux から取得して埋めてください。
  const mockUser = {
    user_cd: user_cd ?? "u001",
    user_name: "山田 太郎",
    email: "taro@example.com",
    center: "東京センター",
    box_account: "box-taro",
    langJa: true,
    template: "標準",
  };

  return (
    <UserTabsShell active="edit">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-3"
              onClick={() => navigate(UrlPath.UserManage)}
            >
              <List className="h-4 w-4" />
              ユーザー一覧へ戻る
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-semibold">{mockUser.user_name}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">ユーザーID: {mockUser.user_cd}</Badge>
              <span className="rounded-full bg-muted px-3 py-1 text-foreground/70">
                所属 {mockUser.center}
              </span>
            </div>
          </div>
        </div>

        {/* カードはすべて縦並びにする */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本設定</CardTitle>
              <CardDescription>ユーザーの基本属性を編集します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                  <Label>ユーザーID</Label>
                  <Input value={mockUser.user_cd} readOnly />
                </div>
                <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                  <Label>表示名</Label>
                  <Input defaultValue={mockUser.user_name} />
                </div>
                <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                  <Label>アカウント名（ドメイン）</Label>
                  <Input defaultValue={mockUser.email.split("@")[0]} />
                </div>
                <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                  <Label>メールアドレス</Label>
                  <Input defaultValue={mockUser.email} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm">保存</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">言語設定</CardTitle>
              <CardDescription>UI言語のデフォルトを切り替えます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between rounded-md border p-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">言語設定</Label>
                  <p className="text-xs text-muted-foreground">日本語 / 英語</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">EN</span>
                  <Switch defaultChecked={mockUser.langJa} />
                  <span className="text-xs font-medium">JA</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm">保存</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">権限設定</CardTitle>
              <CardDescription>所属と権限テンプレートを管理します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Select defaultValue={mockUser.template}>
                  {permissionTemplates.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">権限内容</p>
                    <p className="text-xs text-muted-foreground">テンプレートに紐づく権限の一覧です</p>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1 rounded-full">
                    {mockUser.template}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {[
                    { label: "ジョブ作成", ok: true },
                    { label: "ステータス編集", ok: true },
                    { label: "ログ検索", ok: true },
                    { label: "アクセスユーザー設定", ok: true },
                    { label: "管理メニュー", ok: false },
                    { label: "自動削除フォルダ設定", ok: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 w-full sm:w-[calc(50%-4px)]"
                    >
                      <span className="text-foreground/90">{item.label}</span>
                      <span
                        className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                        aria-label={item.ok ? "許可" : "禁止"}
                      >
                        {item.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button>保存</Button>
              </div>
            </CardContent>
          </Card>

          {/* 削除 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-destructive">ユーザー削除</CardTitle>
              <CardDescription>このユーザーを削除すると元に戻せません。</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">削除する</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      {mockUser.user_name}（ID: {mockUser.user_cd}）を削除します。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        toast(`${mockUser.user_name} を削除しました`);
                        navigate(UrlPath.UserManage);
                      }}
                    >
                      削除する
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserTabsShell>
  );
};

export default UserEdit;
export { UserEdit };
