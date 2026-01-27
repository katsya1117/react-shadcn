import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const Development = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>Development</CardTitle>
        <CardDescription>開発用プレースホルダー画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        デバッグ・実験用のコンポーネントをここで試せます。
      </CardContent>
    </Card>
  </Layout>
);

export default Development;
export { Development };
