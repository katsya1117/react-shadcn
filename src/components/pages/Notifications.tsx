import { Bell } from 'lucide-react'
import Layout from '@/components/frame/Layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const Notifications = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={18} />
          お知らせ
        </CardTitle>
        <CardDescription>最新のジョブ通知とアラート</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        通知のモックです。実装時にバックエンド連携を差し替えてください。
      </CardContent>
    </Card>
  </Layout>
)

export default Notifications
