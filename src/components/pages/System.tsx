import Layout from "@/components/frame/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const System = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>システム設定</CardTitle>
        <CardDescription>全体設定のモック画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        各種設定フォームを追加してください。
      </CardContent>
    </Card>
  </Layout>
);

export default System;
export { System };
