import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { PaginationDemo } from "@/components/common/Pagination/PaginationDemo";

const Development = () => (
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
);

export default Development;
export { Development };
