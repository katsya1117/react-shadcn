// import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import "./App.css";

import { Batch } from "./components/pages/Batch";
import { CenterCreate } from "./components/pages/CenterCreate";
import { CenterEdit } from "./components/pages/CenterEdit";
import { CenterManage } from "./components/pages/CenterManage";
import { Development } from "./components/pages/Development";
import { Information } from "./components/pages/Information";
import { JobCreate } from "./components/pages/JobCreate";
import { JobSearch } from "./components/pages/JobSearch";
import { LogSearch } from "./components/pages/LogSearch";
import { MyPage } from "./components/pages/MyPage";
import { MyPageEdit } from "./components/pages/MyPageEdit";
import { OAOrders } from "./components/pages/OAOrders";
import { OAUsers } from "./components/pages/OAUsers";
import { RoleManage } from "./components/pages/RoleManage";
import { SS } from "./components/pages/SS";
import { ShareArea } from "./components/pages/ShareArea";
import { System } from "./components/pages/System";
import { Tool } from "./components/pages/Tool";
import { UserCreate } from "./components/pages/UserCreate";
import { UserEdit } from "./components/pages/UserEdit";
import { UserManage } from "./components/pages/UserManage";
import { UserProfile } from "./components/pages/UserProfile";
import { UserSetting } from "./components/pages/UserSetting";

import { SimpleSingleSignOn } from "./components/parts/SimpleSingleSignOn/SimpleSingleSignOn";
import { UrlPath } from "./constant/UrlPath";

/**
 * APPコンポーネント
 * UrlPathに応じたページにルーティングする
 * @returns
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={UrlPath.Root} element={<SimpleSingleSignOn />} />
        <Route path={UrlPath.MyPage} element={<MyPage />} />
        <Route path={UrlPath.JobSearch} element={<JobSearch />} />
        <Route path={UrlPath.ShareArea} element={<ShareArea />} />
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
        <Route path={UrlPath.SS} element={<SS />} />
        <Route path={UrlPath.Development} element={<Development />} />

        <Route path="*" element={<Navigate replace to={UrlPath.Root} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
