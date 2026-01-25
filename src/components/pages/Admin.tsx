import { Lock } from 'lucide-react'
import Layout from '@/components/frame/Layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const Admin = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={18} />
          管理
        </CardTitle>
        <CardDescription>ロール管理や権限設定のモック</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        管理者向けの設定フォームをここに配置してください。
      </CardContent>
    </Card>
  </Layout>
)

export default Admin
