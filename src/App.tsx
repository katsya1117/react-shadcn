import { Routes, Route, Navigate } from 'react-router'
import JobSearch from '@/components/pages/JobSearch'
import Notifications from '@/components/pages/Notifications'
import MyPage from '@/components/pages/MyPage'
import CenterArea from '@/components/pages/CenterArea'
import LogSearch from '@/components/pages/LogSearch'
import JobCreate from '@/components/pages/JobCreate'
import ToolPage from '@/components/pages/ToolPage'
import OAIntegration from '@/components/pages/OAIntegration'
import Help from '@/components/pages/Help'
import { UrlPath } from '@/constant/UrlPath'

const AdminPlaceholder = () => (
  <div className="p-4 text-sm text-muted-foreground">管理系ページは未実装です。</div>
)

const App = () => (
  <Routes>
    <Route path={UrlPath.JobSearch} element={<JobSearch />} />
    <Route path={UrlPath.MyPage} element={<MyPage />} />
    <Route path={UrlPath.ShareArea} element={<CenterArea />} />
    <Route path={UrlPath.LogSearch} element={<LogSearch />} />
    <Route path={UrlPath.JobCreate} element={<JobCreate />} />
    <Route path={UrlPath.Tool} element={<ToolPage />} />
    <Route path={UrlPath.OAUsers} element={<OAIntegration />} />
    <Route path={UrlPath.OAOrders} element={<OAIntegration />} />
    <Route path={UrlPath.UserManage} element={<AdminPlaceholder />} />
    <Route path={UrlPath.UserCreate} element={<AdminPlaceholder />} />
    <Route path={UrlPath.UserEdit} element={<AdminPlaceholder />} />
    <Route path={UrlPath.CenterManage} element={<AdminPlaceholder />} />
    <Route path={UrlPath.CenterCreate} element={<AdminPlaceholder />} />
    <Route path={UrlPath.CenterEdit} element={<AdminPlaceholder />} />
    <Route path={UrlPath.ManageRole} element={<AdminPlaceholder />} />
    <Route path={UrlPath.Information} element={<AdminPlaceholder />} />
    <Route path={UrlPath.System} element={<AdminPlaceholder />} />
    <Route path={UrlPath.UserSetting} element={<AdminPlaceholder />} />
    <Route path={UrlPath.Batch} element={<AdminPlaceholder />} />
    <Route path={UrlPath.MyPageEdit} element={<MyPage />} />
    <Route path={UrlPath.UserProfile} element={<MyPage />} />
    {/* 旧 root から JobSearch へリダイレクト */}
    <Route path={UrlPath.Root} element={<MyPage />} />
    <Route path="/notifications" element={<Notifications />} />
    {/* <Route path="/admin" element={<Admin />} /> */}
    <Route path="/help" element={<Help />} />
  </Routes>
)

export default App
