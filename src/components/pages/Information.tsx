import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const Information = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>お知らせ</CardTitle>
        <CardDescription>お知らせ一覧のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        更新情報やメンテナンス告知をここに掲載してください。
      </CardContent>
    </Card>
  </Layout>
);

export default Information;
export { Information };
