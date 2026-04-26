import { LoaderCircle } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SimpleSingleSignOn = () => (
  <Layout hideHeader hideSideMenu className="items-center">
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>サインイン中</CardTitle>
        <CardDescription>シングルサインオンで認証しています。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center text-sm text-muted-foreground">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <LoaderCircle className="h-6 w-6 animate-spin text-[color:var(--brand)]" />
        </div>
        <p>認証が完了するまでそのままお待ちください。</p>
      </CardContent>
    </Card>
  </Layout>
);

export default SimpleSingleSignOn;
