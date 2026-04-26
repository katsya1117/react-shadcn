import { FilePenLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const JobCreate = () => (
  <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilePenLine size={18} />
          JOB作成
        </CardTitle>
        <CardDescription>ジョブ登録フォームの雛形</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        ジョブ名、スケジュール、通知先などの入力項目を追加してください。
      </CardContent>
    </Card>
);

export default JobCreate;
export { JobCreate };
