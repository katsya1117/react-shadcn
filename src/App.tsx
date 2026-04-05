import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  generatePath,
  useParams,
} from "react-router";

import "./App.css";

import { SimpleSingleSignOn } from "./components/parts/SimpleSingleSignOn/SimpleSingleSignOn";
import { Skeleton } from "./components/ui/skeleton";
import { UrlPath } from "./constant/UrlPath";

const Batch = lazy(() => import("./components/pages/Batch"));
const CenterCreate = lazy(() => import("./components/pages/CenterCreate"));
const CenterEdit = lazy(() => import("./components/pages/CenterEdit"));
const CenterManage = lazy(() => import("./components/pages/CenterManage"));
const Development = lazy(() => import("./components/pages/Development"));
const Information = lazy(() => import("./components/pages/Information"));
const JobCreate = lazy(() => import("./components/pages/JobCreate"));
const JobSearch = lazy(() => import("./components/pages/JobSearch"));
const LogSearch = lazy(() => import("./components/pages/LogSearch"));
const MyPage = lazy(() => import("./components/pages/MyPage"));
const MyPageEdit = lazy(() => import("./components/pages/MyPageEdit"));
const OAOrders = lazy(() => import("./components/pages/OAOrders"));
const OAUsers = lazy(() => import("./components/pages/OAUsers"));
const RoleManage = lazy(() => import("./components/pages/RoleManage"));
const SS = lazy(() => import("./components/pages/SS"));
const ShareArea = lazy(() => import("./components/pages/ShareArea"));
const System = lazy(() => import("./components/pages/System"));
const Tool = lazy(() => import("./components/pages/Tool"));
const UserManage = lazy(() => import("./components/pages/UserManage"));
const UserProfile = lazy(() => import("./components/pages/UserProfile"));
const UserSetting = lazy(() => import("./components/pages/UserSetting"));
const UserCreate = lazy(async () => ({
  default: (await import("./components/pages/UserCreate")).UserCreate,
}));
const UserEdit = lazy(async () => ({
  default: (await import("./components/pages/UserEdit")).UserEdit,
}));

const AppRouteFallback = () => (
  <div className="flex min-h-screen flex-col gap-6 p-6">
    <div className="flex items-center justify-between gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-24" />
    </div>

    <div className="grid flex-1 gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="hidden flex-col gap-3 lg:flex">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full rounded-lg" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[18rem] w-full rounded-xl" />
        <Skeleton className="h-[14rem] w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const RootPage =
  import.meta.env.VITE_USE_SIMPLE_SSO === "true"
    ? SimpleSingleSignOn
    : MyPage;

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
    <Suspense fallback={<AppRouteFallback />}>
      <Routes>
        <Route path={UrlPath.Root} element={<RootPage />} />
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
        <Route
          path={UrlPath.SSManageLegacy}
          element={<SSManageLegacyRedirect />}
        />
        <Route
          path={UrlPath.SSLegacy}
          element={<Navigate replace to={UrlPath.ShareArea} />}
        />
        <Route path={UrlPath.Development} element={<Development />} />

        <Route path="*" element={<Navigate replace to={UrlPath.Root} />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
