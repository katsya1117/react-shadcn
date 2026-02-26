import { useState } from "react";
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
import { ChevronUp, ChevronDown, UserRound } from "lucide-react";

/**
 * サイドレイアウト用ヘッダー（タイトルなし、操作系のみ）
 */
export const Header = () => {
  const loginUser = useSelector(userSelector.loginUserSelector());
  const { pathname } = useLocation();
  const [userOpen, setUserOpen] = useState(false);

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
    ].find((item) => pathname.startsWith(item.prefix))?.title ?? "Ops Console";

  if (!loginUser) {
    return <></>;
  }
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 gap-3 max-w-screen-xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-base font-semibold text-foreground">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Information className="h-8 w-8 p-0" />
          <VersionInfo className="h-8 w-8 p-0" />
          <DropdownMenu open={userOpen} onOpenChange={setUserOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <UserRound className="text-muted-foreground" />
                <span className="truncate">
                  {loginUser?.user?.user_cd}({loginUser?.user?.disp_name})
                </span>
                {userOpen ? (
                  <ChevronUp className="text-xs text-muted-foreground" />
                ) : (
                  <ChevronDown className="text-xs text-muted-foreground" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <RouterNavLink to={UrlPath.MyPageEdit}>
                  MyPage設定変更
                </RouterNavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <RouterNavLink to={UrlPath.UserProfile}>
                  ユーザー情報設定変更
                </RouterNavLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
