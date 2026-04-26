import { CircleHelp } from "lucide-react";
import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const Help = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleHelp size={18} />
          ヘルプ
        </CardTitle>
        <CardDescription>ガイドと FAQ のモック</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        よくある質問や問い合わせ先をここに配置してください。
      </CardContent>
    </Card>
  </Layout>
);

export default Help;
