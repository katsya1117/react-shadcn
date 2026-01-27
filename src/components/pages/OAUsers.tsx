import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const OAUsers = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>OAユーザー</CardTitle>
        <CardDescription>OA 連携ユーザー一覧のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        ユーザー検索や連携設定をここに配置してください。
      </CardContent>
    </Card>
  </Layout>
);

export default OAUsers;
export { OAUsers };
