import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { PaginationDemo } from "@/components/parts/Pagination/PaginationDemo";

const Development = () => (
  <Layout>
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Development</CardTitle>
          <CardDescription>開発用プレースホルダー画面です。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          デバッグ・実験用のコンポーネントをここで試せます。
        </CardContent>
      </Card>

      <PaginationDemo />
    </div>
  </Layout>
);

export default Development;
export { Development };
