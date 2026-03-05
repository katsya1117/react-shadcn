import { BrowserRouter, Route, Routes } from "react-router";
import { UrlPath } from "./constant/UrlPath";
import { SS } from "./components/pages/SS";
import { SimpleSingleSignOn } from "./components/parts/SimpleSingleSignOn/SimpleSingleSignOn";
import MyPage from "./components/pages/MyPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path={UrlPath.Root} element={<MyPage />} />
      <Route path={UrlPath.SS} element={<SS />} />
      <Route
        path={UrlPath.SimpleSingleSignOn}
        element={<SimpleSingleSignOn />}
      />
    </Routes>
  </BrowserRouter>
);

export default App;
