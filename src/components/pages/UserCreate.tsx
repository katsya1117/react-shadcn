import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const UserCreate = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>ユーザー作成</CardTitle>
        <CardDescription>ユーザー新規登録のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        入力フォームと保存ボタンを追加してください。
      </CardContent>
    </Card>
  </Layout>
);

export default UserCreate;
export { UserCreate };
