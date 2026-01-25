import {
  Bell,
  CircleHelp,
  LayoutDashboard,
  Search,
  ShieldCheck,
  UserRound,
  Wrench,
  FilePenLine,
  Link2,
  Database,
  Lock,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { brand, navLinks, quickActions, topbar, topbarInner } from './TopmenuStyle.css'

const navItems = [
  { label: 'お知らせ', path: '/notifications', icon: Bell, iconOnly: true },
  { label: 'MyPage', path: '/mypage', icon: UserRound },
  { label: 'JOB SEARCH', path: '/', icon: LayoutDashboard, end: true },
  { label: 'センター専用領域', path: '/center', icon: Database },
  { label: 'LOG SEARCH', path: '/logs', icon: ShieldCheck },
  { label: 'JOB作成', path: '/jobs/new', icon: FilePenLine },
  { label: 'TOOL', path: '/tools', icon: Wrench },
  { label: 'OA連携', path: '/oa', icon: Link2 },
  { label: '管理', path: '/admin', icon: Lock },
  { label: 'ヘルプ', path: '/help', icon: CircleHelp, iconOnly: true },
]

const Topmenu = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path))

  return (
    <header className={topbar}>
      <div className={topbarInner}>
        <div className="flex items-center gap-4 min-w-0 flex-nowrap">
          <button
            className={`${brand} shrink-0`}
            onClick={() => navigate('/')}
            aria-label="Go to dashboard"
            type="button"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <LayoutDashboard size={18} />
            </div>
            <span>Ops Console</span>
            <Badge variant="outline" className="hidden sm:inline-flex">
              Mock
            </Badge>
          </button>
          <nav className={`${navLinks} flex-1 min-w-0`}>
            {navItems.map(({ icon: Icon, label, path, iconOnly }) => {
              const active = isActive(path)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition',
                    iconOnly ? 'justify-center' : '',
                    active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80',
                  ].join(' ')}
                >
                  <Icon size={16} />
                  {!iconOnly && <span>{label}</span>}
                </button>
              )
            })} 
          </nav>
        </div>
        <div className={quickActions}>
          <div className="hidden lg:block">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="ジョブID / フォルダを検索"
                className="w-48 pl-9 text-xs"
                aria-label="グローバル検索"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="通知"
            onClick={() => navigate('/notifications')}
          >
            <Bell size={18} />
          </Button>
          <Button variant="outline" size="md" className="gap-2" onClick={() => navigate('/mypage')}>
            <UserRound size={16} />
            <span className="hidden sm:inline">sre-user</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Topmenu
