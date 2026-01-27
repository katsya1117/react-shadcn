import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const UserEdit = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>ユーザー編集</CardTitle>
        <CardDescription>ユーザー情報の編集モック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        既存ユーザーの詳細をここに表示し、編集項目を追加してください。
      </CardContent>
    </Card>
  </Layout>
);

export default UserEdit;
export { UserEdit };
