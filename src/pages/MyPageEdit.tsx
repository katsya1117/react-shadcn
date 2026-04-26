import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const MyPageEdit = () => (
  <Card>
      <CardHeader>
        <CardTitle>MyPage編集</CardTitle>
        <CardDescription>
          プロフィールや通知設定の編集モックです。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        入力フォームを追加して保存処理を実装してください。
      </CardContent>
    </Card>
);

export default MyPageEdit;
export { MyPageEdit };
