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
  </Routes>
)

export default App
