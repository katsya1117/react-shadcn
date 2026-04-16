import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const Information = () => (
  <Card>
      <CardHeader>
        <CardTitle>お知らせ</CardTitle>
        <CardDescription>お知らせ一覧のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        更新情報やメンテナンス告知をここに掲載してください。
      </CardContent>
    </Card>
);

export default Information;
export { Information };
