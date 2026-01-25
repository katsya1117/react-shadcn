import { Search } from 'lucide-react'
import Layout from '@/components/frame/Layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const LogSearch = () => (
  <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search size={18} />
          LOG SEARCH
        </CardTitle>
        <CardDescription>ログ検索 UI のモック</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        検索フォームや結果テーブルをここに差し込んでください。
      </CardContent>
    </Card>
  </Layout>
)

export default LogSearch
