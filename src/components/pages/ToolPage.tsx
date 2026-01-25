import { Wrench } from 'lucide-react'
import Layout from '@/components/frame/Layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const ToolPage = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench size={18} />
          TOOL
        </CardTitle>
        <CardDescription>運用ツールのランチャー領域</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        バッチ実行、スクリプト、クイックリンクをここに配置してください。
      </CardContent>
    </Card>
  </Layout>
)

export default ToolPage
