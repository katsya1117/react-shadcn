import { useEffect, useState } from "react";
import { Container, Dropdown, Nav, Navbar, NavItem, NavLink } from "react-bootstrap";
import { useSelector } from "react-redux";
import { NavLink as RouterNavLink, useLocation } from "react-router";

import { UrlPath } from "../../constant/UrlPath";
import { userSelector } from "../../redux/slices/userSlice";
import { Information } from "../parts/Information/Information";
import { VersionInfo } from "../parts/Version/VersionInfo";
import { TopMenuStyle } from "./TopMenuStyle.css";

/**
 * 上部メニューコンポーネント
 * @param props
 * @returns.
 */
export const TopMenu = (props: { hideMenu: boolean | undefined }) => {
  const loginUser = useSelector(
    userSelector.loginUserSelector()
  );

  // const isLoading = useSelector(userSelector.isLoadingSelector());
  // const isLogin = useSelector(userSelector.isLoginSelector());
  // const dispatch: AppDispatch = useDispatch();

  const [showOA, setShowOA] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const [anchorOA, setAnchorOA] = useState(false);
  const [anchorManage, setAnchorManage] = useState(false);
  const [anchorUser, setAnchorUser] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("/OA/")) {
      setAnchorOA(true);
    } else {
      setAnchorOA(false);
    }

    if (location.pathname.includes("/manage/")) {
      setAnchorManage(true);
    } else {
      setAnchorManage(false);
    }

    if (location.pathname.includes("/user/")) {
      setAnchorUser(true);
    } else {
      setAnchorUser(false);
    }

    return () => {
      // クリーンアップ
    };
  }, [location]);

  if (!loginUser) {
    return <></>;
  }

  if (props.hideMenu) {
    return <></>;
  }

  return (
    <div className={TopMenuStyle.container}>
      <Navbar>
        <Container fluid>
          <Nav fill variant="tabs" defaultActiveKey="MyPage">
            <Information />

            <Nav.Item>
              <RouterNavLink className="nav-link" to={UrlPath.MyPage}>
                MyPage
              </RouterNavLink>
            </Nav.Item>

            <Nav.Item>
              <RouterNavLink className="nav-link" to={UrlPath.JobSearch}>
                JOB SEARCH
              </RouterNavLink>
            </Nav.Item>

            <Nav.Item>
              <RouterNavLink className="nav-link" to={UrlPath.ShareArea}>
                センター専用領域
              </RouterNavLink>
            </Nav.Item>

            <Nav.Item>
              <RouterNavLink className="nav-link" to={UrlPath.LogSearch}>
                LOG SEARCH
              </RouterNavLink>
            </Nav.Item>

            <Nav.Item>
              <RouterNavLink className="nav-link" to={UrlPath.JobCreate}>
                JOB作成
              </RouterNavLink>
            </Nav.Item>

            <Nav.Item>
              <RouterNavLink className="nav-link" to={UrlPath.Tool}>
                TOOL
              </RouterNavLink>
            </Nav.Item>

            <Nav.Item>
              <Dropdown
                as={NavItem}
                show={showOA}
                onMouseEnter={() => setShowOA(true)}
                onMouseLeave={() => setShowOA(false)}
              >
                <Dropdown.Toggle as={NavLink} active={anchorOA}>
                  OA連携
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <RouterNavLink className="nav-link" to={UrlPath.OAUsers}>
                    OAユーザ表示
                  </RouterNavLink>
                  <RouterNavLink className="nav-link" to={UrlPath.OAOrders}>
                    OA工番情報
                  </RouterNavLink>
                </Dropdown.Menu>
              </Dropdown>
            </Nav.Item>

            <Nav.Item>
              <Dropdown
                as={NavItem}
                show={showManage}
                onMouseEnter={() => setShowManage(true)}
                onMouseLeave={() => setShowManage(false)}
              >
                <Dropdown.Toggle as={NavLink} active={anchorManage}>
                  ËI
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <RouterNavLink className="nav-link" to={UrlPath.UserManage}>
                    ユーザ設定
                  </RouterNavLink>
                  <RouterNavLink className="nav-link" to={UrlPath.CenterManage}>
                    センター設定
                  </RouterNavLink>
                  <RouterNavLink className="nav-link" to={UrlPath.ManageRole}>
                    アクセスユーザー設定
                  </RouterNavLink>
                  <RouterNavLink className="nav-link" to={UrlPath.Information}>
                    お知らせ設定
                  </RouterNavLink>
                  <RouterNavLink className="nav-link" to={UrlPath.System}>
                    システム設定
                  </RouterNavLink>
                  <RouterNavLink className="nav-link" to={UrlPath.UserSetting}>
                    ユーザー設定状況
                  </RouterNavLink>
                  <RouterNavLink className="nav-link" to={UrlPath.Batch}>
                    バッチステータス
                  </RouterNavLink>
                </Dropdown.Menu>
              </Dropdown>
            </Nav.Item>

            <VersionInfo />
          </Nav>

          <Nav fill variant="tabs">
            <Nav.Item className="d-flex">
              <Dropdown
                as={NavItem}
                show={showUser}
                onMouseEnter={() => setShowUser(true)}
                onMouseLeave={() => setShowUser(false)}
              >
                <Dropdown.Toggle as={NavLink} active={anchorUser}>
                  {loginUser.user?.user_cd}
                  ({loginUser.user?.disp_name})
                </Dropdown.Toggle>

                <Dropdown.Menu align="end">
                  <RouterNavLink className="nav-link" to={UrlPath.MyPageEdit}>
                    MyPage設定変更
                  </RouterNavLink>
                  <RouterNavLink className="nav-link" to={UrlPath.UserProfile}>
                    ユーザー情報設定変更
                  </RouterNavLink>
                </Dropdown.Menu>
              </Dropdown>
            </Nav.Item>
          </Nav>
        </Container>
      </Navbar>
    </div>
  );
};