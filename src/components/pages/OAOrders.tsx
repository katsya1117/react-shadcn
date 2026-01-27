import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const OAOrders = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>OA工番情報</CardTitle>
        <CardDescription>OA 連携の工番参照モック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        工番リストや検索フォームをここに追加してください。
      </CardContent>
    </Card>
  </Layout>
);

export default OAOrders;
export { OAOrders };
