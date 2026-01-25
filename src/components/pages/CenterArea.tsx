import { Database } from 'lucide-react'
import Layout from '@/components/frame/Layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const CenterArea = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database size={18} />
          センター専用領域
        </CardTitle>
        <CardDescription>センター固有ジョブや権限のダッシュボード</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        ここにセンター専用のメトリクスやショートカットを配置してください。
      </CardContent>
    </Card>
  </Layout>
)

export default CenterArea
