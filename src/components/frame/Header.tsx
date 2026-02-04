import { Information } from "../parts/Information/Information";
import { VersionInfo } from "../parts/Version/VersionInfo";
import { userSelector } from "@/redux/slices/userSlice";
import { useSelector } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UrlPath } from "@/constant/UrlPath";
import { NavLink as RouterNavLink, useLocation } from "react-router";

/**
 * サイドレイアウト用ヘッダー（タイトルなし、操作系のみ）
 */
const Header = () => {
  const loginUser = useSelector(userSelector.loginUserSelector());
  const location = useLocation();

  const title =
    [
      { prefix: "/OA/", title: "OA連携" },
      { prefix: "/manage/", title: "管理" },
      { prefix: UrlPath.MyPage, title: "MyPage" },
      { prefix: UrlPath.JobSearch, title: "JOB SEARCH" },
      { prefix: UrlPath.LogSearch, title: "LOG SEARCH" },
      { prefix: UrlPath.JobCreate, title: "JOB作成" },
      { prefix: UrlPath.Tool, title: "TOOL" },
      { prefix: UrlPath.ShareArea, title: "センター専用領域" },
    ].find(({ prefix }) => location.pathname.startsWith(prefix))?.title ?? "Ops Console";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 gap-3 max-w-screen-xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-base font-semibold text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Information className="h-8 w-8 p-0" />
          <VersionInfo className="h-8 w-8 p-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="truncate">
                  {loginUser?.user?.disp_name ?? loginUser?.user?.user_cd ?? "guest"}
                </span>
                <span className="text-xs text-muted-foreground">▼</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <RouterNavLink to={UrlPath.MyPageEdit}>MyPage設定変更</RouterNavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <RouterNavLink to={UrlPath.UserProfile}>ユーザー情報設定変更</RouterNavLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
