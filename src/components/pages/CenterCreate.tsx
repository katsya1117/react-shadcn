import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CenterTabsShell } from "@/components/pages/CenterTabsShell";

const CenterCreate = () => (
  <CenterTabsShell active="new">
    <Card>
      <CardHeader>
        <CardTitle>センター作成</CardTitle>
        <CardDescription>センター新規登録フォームのモックです。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        入力項目を追加して作成処理を実装してください。
      </CardContent>
    </Card>
  </CenterTabsShell>
);

export default CenterCreate;
export { CenterCreate };
