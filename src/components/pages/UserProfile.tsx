import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const UserProfile = () => (
  <Card>
      <CardHeader>
        <CardTitle>ユーザープロファイル</CardTitle>
        <CardDescription>
          ユーザープロファイル表示のモック画面です。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        プロフィール詳細や編集導線をここに配置してください。
      </CardContent>
    </Card>
);

export default UserProfile;
export { UserProfile };
