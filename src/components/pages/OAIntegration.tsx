import { Link2 } from "lucide-react";
import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const OAIntegration = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 size={18} />
          OA連携
        </CardTitle>
        <CardDescription>OA システムとの連携設定</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        API キーやコールバック URL の入力欄を追加して統合してください。
      </CardContent>
    </Card>
  </Layout>
);

export default OAIntegration;
