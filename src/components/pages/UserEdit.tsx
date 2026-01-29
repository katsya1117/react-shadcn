import { useParams, useNavigate } from "react-router";
import Layout from "@/components/frame/Layout";
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
import { ArrowLeft } from "lucide-react";

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
    <Layout>
      <Card>
        <CardHeader className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeft
                size={18}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => navigate(-1)}
              />
              編集 &gt; {mockUser.user_name}
            </CardTitle>
            <CardDescription>検索結果一覧に戻るには上の戻るアイコンをクリックしてください。</CardDescription>
          </div>
          <Badge variant="outline">ユーザーID: {mockUser.user_cd}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label>ユーザーID</Label>
            <Input value={mockUser.user_cd} readOnly />
            <Label>表示名</Label>
            <Input defaultValue={mockUser.user_name} />
            <Label>アカウント名（ドメイン）</Label>
            <Input defaultValue={mockUser.email.split("@")[0]} />
            <Label>メールアドレス</Label>
            <Input defaultValue={mockUser.email} />
            <div className="flex items-start justify-between rounded-md border p-3 gap-3">
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
          </div>

          <div className="space-y-3">
            <Label>所属センター</Label>
            <Input defaultValue={mockUser.center} />
            <Label>操作権限テンプレート</Label>
            <Select defaultValue={mockUser.template}>
              {permissionTemplates.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">権限内容</span>
                <Badge variant="outline">{mockUser.template}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>ジョブ作成: 可</span>
                <span>ステータス編集: 可</span>
                <span>ログ検索: 可</span>
                <span>アクセスユーザー設定: 可</span>
                <span>管理メニュー: 不可</span>
                <span>自動削除フォルダ設定: 不可</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                一覧に戻る
              </Button>
              <Button>保存</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default UserEdit;
export { UserEdit };
