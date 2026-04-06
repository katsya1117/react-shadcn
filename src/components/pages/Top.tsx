import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Database, FileSearch, FilePlus2 } from "lucide-react";

const quickActions = [
  { icon: Search, label: "JOB SEARCH", description: "ジョブの検索・確認" },
  { icon: Database, label: "センター専用領域", description: "共有ファイルの管理" },
  { icon: FileSearch, label: "LOG SEARCH", description: "ログの検索・分析" },
  { icon: FilePlus2, label: "JOB作成", description: "新規ジョブの作成" },
];

const Top = () => (
  <Layout>
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">ようこそ、Ops Console へ</CardTitle>
          <CardDescription>
            システム運用に必要な機能をまとめた統合コンソールです。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button>はじめる</Button>
          <Button variant="outline">ドキュメントを見る</Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
          クイックアクセス
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ icon: Icon, label, description }) => (
            <Card
              key={label}
              className="group cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats / Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">本日のJOB実行数</div>
            <div className="text-3xl font-semibold text-foreground mt-1">
              128
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              前日比 <span className="text-green-600 dark:text-green-400">+12%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">アクティブユーザー</div>
            <div className="text-3xl font-semibold text-foreground mt-1">
              24
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              オンライン
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">システム状態</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-lg font-medium text-foreground">正常稼働中</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              最終確認: 1分前
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </Layout>
);

export default Top;
export { Top };
