import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const UserSetting = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>ユーザー設定状況</CardTitle>
        <CardDescription>設定ステータス確認のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        各ユーザーの設定完了状況を表示するテーブルを追加してください。
      </CardContent>
    </Card>
  </Layout>
);

export default UserSetting;
export { UserSetting };
