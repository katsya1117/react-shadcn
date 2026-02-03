import { Information } from "../parts/Information/Information";
import { VersionInfo } from "../parts/Version/VersionInfo";
import { userSelector } from "@/redux/slices/userSlice";
import { useSelector } from "react-redux";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UrlPath } from "@/constant/UrlPath";
import { NavLink as RouterNavLink } from "react-router";

type Props = {
  title?: string;
  subtitle?: string;
};

const SideHeaderv2 = ({ title = "Ops Console", subtitle = "Side Layout" }: Props) => {
  const loginUser = useSelector(userSelector.loginUserSelector());

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span>{title}</span>
          {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
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

export default SideHeaderv2;
