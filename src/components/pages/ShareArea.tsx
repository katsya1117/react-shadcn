import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const ShareArea = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>センター専用領域</CardTitle>
        <CardDescription>センター領域一覧のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        権限付きフォルダ一覧などをここに表示してください。
      </CardContent>
    </Card>
  </Layout>
);

export default ShareArea;
export { ShareArea };
