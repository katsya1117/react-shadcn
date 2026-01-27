import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const CenterEdit = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>センター編集</CardTitle>
        <CardDescription>センター情報の編集画面モックです。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        既存センターの詳細をここに表示し、編集項目を追加してください。
      </CardContent>
    </Card>
  </Layout>
);

export default CenterEdit;
export { CenterEdit };
