import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Database,
  FileSearch,
  FilePlus2,
  TrendingUp,
  Users,
  Activity,
  ArrowRight,
} from "lucide-react";

const quickActions = [
  {
    icon: Search,
    label: "JOB SEARCH",
    description: "ジョブの検索・確認",
    color: "bg-[#065b8b]",
  },
  {
    icon: Database,
    label: "センター専用領域",
    description: "共有ファイルの管理",
    color: "bg-[#0891b2]",
  },
  {
    icon: FileSearch,
    label: "LOG SEARCH",
    description: "ログの検索・分析",
    color: "bg-[#0369a1]",
  },
  {
    icon: FilePlus2,
    label: "JOB作成",
    description: "新規ジョブの作成",
    color: "bg-[#0284c7]",
  },
];

const stats = [
  {
    label: "本日のJOB実行数",
    value: "128",
    change: "+12%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    label: "アクティブユーザー",
    value: "24",
    subtext: "オンライン",
    icon: Users,
  },
  {
    label: "システム状態",
    value: "正常稼働中",
    status: "healthy",
    icon: Activity,
  },
];

const Top = () => (
  <Layout>
    <div className="space-y-8">
      {/* Hero Section - ブランドカラーを大胆に使用 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#065b8b] via-[#0369a1] to-[#0891b2] p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMGgxdjFoLTF2LTF6bTQgMmgxdjFoLTF2LTF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight">
            ようこそ、Ops Console へ
          </h1>
          <p className="mt-2 text-white/80 max-w-xl">
            システム運用に必要な機能をまとめた統合コンソールです。
            効率的なオペレーションを実現します。
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              className="bg-white text-[#065b8b] hover:bg-white/90 font-medium"
            >
              はじめる
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              ドキュメントを見る
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, change, trend, subtext, status, icon: Icon }) => (
          <Card key={label} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {label}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    {status === "healthy" && (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                    <span className="text-2xl font-semibold text-foreground">
                      {value}
                    </span>
                  </div>
                  {change && (
                    <p className="mt-1 text-sm">
                      <span
                        className={
                          trend === "up"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {change}
                      </span>
                      <span className="text-muted-foreground ml-1">前日比</span>
                    </p>
                  )}
                  {subtext && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {subtext}
                    </p>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-secondary">
                  <Icon size={20} className="text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions - カードに左ボーダーでブランドカラーを表現 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            クイックアクセス
          </h2>
          <Button variant="ghost" size="sm" className="text-primary gap-1">
            すべて見る
            <ArrowRight size={16} />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ icon: Icon, label, description, color }) => (
            <Card
              key={label}
              className="group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary transition-all duration-200 hover:shadow-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl ${color} text-white shadow-lg shadow-primary/20`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {label}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </Layout>
);

export default Top;
export { Top };
