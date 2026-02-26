import { UserRound } from "lucide-react";
import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const MyPage = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound size={18} />
          MyPage
        </CardTitle>
        <CardDescription>個人設定とジョブ購読のモック画面</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        プロファイル編集や通知設定をここに実装予定です。
      </CardContent>
    </Card>
  </Layout>
);

export default MyPage;
export { MyPage };
