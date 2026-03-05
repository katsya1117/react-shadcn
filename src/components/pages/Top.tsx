import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Top = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>Top</CardTitle>
        <CardDescription>トップページのプレースホルダーです。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        必要に応じてコンテンツを追加してください。
      </CardContent>
    </Card>
  </Layout>
);

export default Top;
export { Top };
