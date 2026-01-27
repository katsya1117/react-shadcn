import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const UserProfile = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>ユーザープロファイル</CardTitle>
        <CardDescription>ユーザープロファイル表示のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        プロフィール詳細や編集導線をここに配置してください。
      </CardContent>
    </Card>
  </Layout>
);

export default UserProfile;
export { UserProfile };
