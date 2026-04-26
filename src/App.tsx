import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  generatePath,
  useParams,
} from "react-router";

import "./App.css";

import { Layout } from "./components/layout/Layout";
import { Batch } from "./pages/Batch";
import { CenterCreate } from "./pages/CenterCreate";
import { CenterEdit } from "./pages/CenterEdit";
import { CenterManage } from "./pages/CenterManage";
import { Development } from "./pages/Development";
import { Information } from "./pages/Information";
import { JobCreate } from "./pages/JobCreate";
import { JobSearch } from "./pages/JobSearch";
import { LogSearch } from "./pages/LogSearch";
import { MyPage } from "./pages/MyPage";
import { MyPageEdit } from "./pages/MyPageEdit";
import { OAOrders } from "./pages/OAOrders";
import { OAUsers } from "./pages/OAUsers";
import { RoleManage } from "./pages/RoleManage";
import { SS } from "./pages/SS";
import { ShareArea } from "./pages/ShareArea";
import { ShareArea2 } from "./pages/ShareArea2";
import { System } from "./pages/System";
import { Tool } from "./pages/Tool";
import { UserCreate } from "./pages/UserCreate";
import { UserEdit } from "./pages/UserEdit";
import { UserManage } from "./pages/UserManage";
import { UserProfile } from "./pages/UserProfile";
import { UserSetting } from "./pages/UserSetting";
import { SimpleSingleSignOn } from "./components/common/SimpleSingleSignOn/SimpleSingleSignOn";
import { UrlPath } from "./constants/UrlPath";
import { ScrollReset } from "./components/common/ScrollReset/ScrollReset";

const RootPage =
  import.meta.env.VITE_USE_SIMPLE_SSO === "true" ? SimpleSingleSignOn : MyPage;

const SSManageLegacyRedirect = () => {
  const { rootFolderId } = useParams();

  if (!rootFolderId) {
    return <Navigate replace to={UrlPath.ShareArea} />;
  }

  return (
    <Navigate
      replace
      to={generatePath(UrlPath.SS, {
        rootFolderId,
      })}
    />
  );
};

const App = () => (
  <BrowserRouter>
    <ScrollReset />
    <Routes>
      {/* Layout でラップされたルート */}
      <Route element={<Layout><Outlet /></Layout>}>
        <Route path={UrlPath.Root} element={<RootPage />} />
        <Route path={UrlPath.MyPage} element={<MyPage />} />
        <Route path={UrlPath.JobSearch} element={<JobSearch />} />
        {/* ShareArea UI切り替え: ShareArea（カード形式）/ ShareArea2（リスト形式）*/}
        <Route path={UrlPath.ShareArea} element={<ShareArea2 />} />
        {/* <Route path={UrlPath.ShareArea} element={<ShareArea />} /> */}
        <Route path={UrlPath.LogSearch} element={<LogSearch />} />
        <Route path={UrlPath.JobCreate} element={<JobCreate />} />
        <Route path={UrlPath.Tool} element={<Tool />} />

        <Route path={UrlPath.OAUsers} element={<OAUsers />} />
        <Route path={UrlPath.OAOrders} element={<OAOrders />} />
        <Route path={UrlPath.UserManage} element={<UserManage />} />
        <Route path={UrlPath.UserCreate} element={<UserCreate />} />
        <Route path={UrlPath.UserEdit} element={<UserEdit />} />
        <Route path={UrlPath.CenterManage} element={<CenterManage />} />
        <Route path={UrlPath.CenterCreate} element={<CenterCreate />} />
        <Route path={UrlPath.CenterEdit} element={<CenterEdit />} />

        <Route path={UrlPath.ManageRole} element={<RoleManage />} />
        <Route path={UrlPath.Information} element={<Information />} />
        <Route path={UrlPath.System} element={<System />} />
        <Route path={UrlPath.UserSetting} element={<UserSetting />} />
        <Route path={UrlPath.Batch} element={<Batch />} />

        <Route path={UrlPath.MyPageEdit} element={<MyPageEdit />} />
        <Route path={UrlPath.UserProfile} element={<UserProfile />} />
        <Route
          path={UrlPath.SSManageLegacy}
          element={<SSManageLegacyRedirect />}
        />
        <Route
          path={UrlPath.SSLegacy}
          element={<Navigate replace to={UrlPath.ShareArea} />}
        />
        <Route path={UrlPath.Development} element={<Development />} />
      </Route>

      {/* SS は独自の Layout props (fluid, subtitle) を使うためネスト外 */}
      <Route path={UrlPath.SS} element={<SS />} />

      <Route path="*" element={<Navigate replace to={UrlPath.Root} />} />
    </Routes>
  </BrowserRouter>
);

export default App;
