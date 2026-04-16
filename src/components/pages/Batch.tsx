import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const Batch = () => (
  <Card>
      <CardHeader>
        <CardTitle>バッチステータス</CardTitle>
        <CardDescription>バッチ実行状況のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        ここにバッチ一覧や実行ログを表示してください。
      </CardContent>
    </Card>
);

export default Batch;
export { Batch };
