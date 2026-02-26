import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const Tool = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>TOOL</CardTitle>
        <CardDescription>ツール集のプレースホルダーです。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        実装予定のツール一覧をここに並べてください。
      </CardContent>
    </Card>
  </Layout>
);

export default Tool;
export { Tool };
