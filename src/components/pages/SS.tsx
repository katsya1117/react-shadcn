import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const SS = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>SS</CardTitle>
        <CardDescription>
          シングルサインオン関連のプレースホルダーです。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        実装が決まり次第ここに追加してください。
      </CardContent>
    </Card>
  </Layout>
);

export default SS;
export { SS };
