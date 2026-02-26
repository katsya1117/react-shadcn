import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

export const SimpleSingleSignOn = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>Simple SSO</CardTitle>
        <CardDescription>
          簡易シングルサインオンのプレースホルダーです。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        認証フローが決まり次第ここに実装してください。
      </CardContent>
    </Card>
  </Layout>
);

export default SimpleSingleSignOn;
