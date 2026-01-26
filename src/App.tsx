import { Routes, Route } from 'react-router'
import JobSearch from '@/components/pages/JobSearch'
import Notifications from '@/components/pages/Notifications'
import MyPage from '@/components/pages/MyPage'
import CenterArea from '@/components/pages/CenterArea'
import LogSearch from '@/components/pages/LogSearch'
import JobCreate from '@/components/pages/JobCreate'
import ToolPage from '@/components/pages/ToolPage'
import OAIntegration from '@/components/pages/OAIntegration'
import Admin from '@/components/pages/Admin'
import Help from '@/components/pages/Help'

const App = () => (
  <Routes>
    <Route path="/" element={<JobSearch />} />
    <Route path="/notifications" element={<Notifications />} />
    <Route path="/mypage" element={<MyPage />} />
    <Route path="/center" element={<CenterArea />} />
    <Route path="/logs" element={<LogSearch />} />
    <Route path="/jobs/new" element={<JobCreate />} />
    <Route path="/tools" element={<ToolPage />} />
    <Route path="/oa" element={<OAIntegration />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="/help" element={<Help />} />
    {/* 互換パス（旧 UrlPath 定義に対応） */}
    <Route path="/job/JobSearch" element={<JobSearch />} />
    <Route path="/job/MyPage" element={<MyPage />} />
    <Route path="/job/ShareArea" element={<CenterArea />} />
    <Route path="/job/LogSearch" element={<LogSearch />} />
    <Route path="/job/JobCreate" element={<JobCreate />} />
    <Route path="/job/Tool" element={<ToolPage />} />
    <Route path="/OA/Users" element={<OAIntegration />} />
    <Route path="/OA/Orders" element={<OAIntegration />} />
    <Route path="/manage/User" element={<Admin />} />
    <Route path="/manage/User/new" element={<Admin />} />
    <Route path="/manage/User/:user_cd" element={<Admin />} />
    <Route path="/manage/Center" element={<Admin />} />
    <Route path="/manage/Center/new" element={<Admin />} />
    <Route path="/manage/Center/:center_cd" element={<Admin />} />
    <Route path="/manage/Role" element={<Admin />} />
    <Route path="/manage/Information" element={<Admin />} />
    <Route path="/manage/System" element={<Admin />} />
    <Route path="/manage/UserSetting" element={<Admin />} />
    <Route path="/manage/Batch" element={<Admin />} />
  </Routes>
)

export default App
