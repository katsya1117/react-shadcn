import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageUnderConstructionProps = {
  title?: string;
  description?: string;
  note?: string;
};

export const PageUnderConstruction = ({
  title = "この画面は現在実装中です",
  description = "別部署テストでは、画面導線とレイアウトのみご確認ください。",
  note = "実装完了後にこの案内は外せます。",
}: PageUnderConstructionProps) => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {note}
      </CardContent>
    </Card>
  </Layout>
);

export default PageUnderConstruction;
