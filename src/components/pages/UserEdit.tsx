import type {
  AutoCompleteData,
  DefaultSelection36PermissionPayload,
  UserUpdateParams,
} from "@/api";
import { SearchSetApi } from "@/api";
import { UserTabsShell } from "@/components/pages/UserTabsShell";
import { AutoCompleteSingle } from "@/components/parts/AutoComplete/AutoCompleteSingle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { ConfirmButton, ConFirmButton } from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { UrlPath } from "@/constant/UrlPath";
import { autoCompleteSelector } from "@/redux/slices/autoCompleteSlice";
import {
  getPermissionList,
  permissionSelector,
} from "@/redux/slices/permissionSlice";
import {
  getUserInfo,
  removeUser,
  updateUserInfo,
  userSelector,
} from "@/redux/slices/userSlice";
import type { AppDispatch } from "@/store";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useParams } from "react-router";
import type { SingleValue } from "react-select";
import Config from "../../config/apiConfig";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Skeleton } from "../ui/skeleton";

type PermBase = Omit<
  DefaultSelection36PermissionPayload,
  | "perm_cd"
  | "perm_name"
  | "id"
  | "can_group_adduser"
  | "can_status_force_close"
  | "can_status_openclose"
  | "search_cd1"
  | "search_cd2"
  | "search_cd3"
>;

type PermCd = keyof PermBase;

type PermLabel =
  | "ジョブ作成"
  | "ステータスインポート"
  | "アクセスユーザー設定"
  | "ステータス編集"
  | "保管期限変更"
  | "JOB属性編集"
  | "再版"
  | "ユーザー特定設定"
  | "ログ検索"
  | "管理メニュー"
  | "NGワード"
  | "自動削除フォルダー設定"
  | "MyPageデフォルト検索条件1"
  | "MyPageデフォルト検索条件2"
  | "MyPageデフォルト検索条件3";

type PermLabelMap = {
  [key in PermCd]: PermLabel;
};

const permLabelMap: PermLabelMap = {
  can_job_create: "ジョブ作成",
  can_status_import: "ステータスインポート",
  can_access_authority: "アクセスユーザー設定",
  can_status_change: "ステータス編集",
  can_job_change_expiry: "保管期限変更",
  can_job_change: "JOB属性編集",
  can_status_reissue: "再版",
  can_job_arrow_user: "ユーザー特定設定",
  can_log_search: "ログ検索",
  can_manage: "管理メニュー",
  can_ng_word: "NGワード",
  can_auto_delete: "自動削除フォルダー設定",
};

interface Permission {
  key: PermCd;
  label: PermLabel;
  value: number;
}

interface SearchCondition {
  key: string;
  label:
    | "MyPageデフォルト検索条件1"
    | "MyPageデフォルト検索条件2"
    | "MyPageデフォルト検索条件3";
  search_cd: SearchConditionCd;
  value: SearchConditionVal;
}

interface DispPerm {
  perm_cd: string;
  perm_name: string;
  permissions: Permission[];
  search_conditions: SearchCondition[];
}

type SearchConditionCd = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type SearchConditionVal =
  | "6ヶ月経過JOB"
  | "長期放置JOB"
  | "作業終了後3ヶ月経過JOB"
  | "作業終了JOB"
  | "当月保管期限JOB"
  | "M-D保管期限JOB"
  | "削除フラグJOB";

type SearchConditionValMap = {
  [key in SearchConditionCd]: SearchConditionVal;
};

const SearchConditionValMap: SearchConditionValMap = {
  1: "6ヶ月経過JOB",
  2: "長期放置JOB",
  3: "作業終了後3ヶ月経過JOB",
  4: "作業終了JOB",
  5: "当月保管期限JOB",
  6: "M-D保管期限JOB",
  7: "削除フラグJOB",
};

const MAX_DISP_LEN = 100;
const MAX_ACCOUNT_LEN = 100;
const MAX_EMAIL_LEN = 200;

export const UserEdit = () => {
  const { user_cd } = useParams();
  const dispatch: AppDispatch = useDispatch();
  const target = useSelector(userSelector.userTargetSelector());
  const permissionList = useSelector(permissionSelector.permListSelector());
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const isLoading = useSelector(userSelector.isLoadingSelector());

  const [dispName, setDispName] = useState("");
  const [account, setAccount] = useState("");
  const [mail, setMail] = useState("");
  const [belonging, setBelonging] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [lang, setLang] = useState<"ja" | "en" | "undefined">();
  const [permission, setPermission] = useState("");

  useEffect(() => {
    if (!user_cd) return;
    dispatch(getUserInfo(user_cd));
    if (!permissionList) {
      dispatch(getPermissionList());
    }
    return () => {
      setDispName("");
      setAccount("");
      setMail("");
      setBelonging(null);
      setLang(undefined);
      setPermission("");
    };
  }, [user_cd, dispatch, permissionList]);

  useEffect(() => {
    if (target?.user && target.user.user_cd === user_cd) {
      const { user, center } = target;
      setDispName(user.user_name ?? "");
      setAccount(user.user_account ?? "");
      setMail(user.email ?? "");
      const centerCd = center?.find((c) => c.belonging_flg === 0)?.center_cd;
      const matchedGroup = groups.find((g) => g.value === centerCd);
      setBelonging(matchedGroup ? matchedGroup : null);
      setLang(
        user.language_code === 0
          ? "ja"
          : user.language_code === 1
            ? "en"
            : "undefined",
      );
      setPermission(user.perm_cd ?? "");
    }
    return () => {
      // クリーンアップ
    };
  }, [target, groups, user_cd]);

  const displayPermList: DispPerm[] = useMemo(() => {
    if (!permissionList) return [];
    return permissionList.map((p) => {
      const {
        perm_cd,
        perm_name,
        search_cd1,
        search_cd2,
        search_cd3,
        /* eslint-disable @typescript-eslint/no-unused-vars*/
        id,
        can_group_adduser,
        can_status_force_close,
        can_status_openclose,
        /* eslint-enable @typescript-eslint/no-unused-vars*/
        ...permInfo
      } = p;

      const permissions: Permission[] = Object.entries(permInfo)
        .filter(([key]) => key in permLabelMap)
        .map(([key, value]) => ({
          key: key as PermCd,
          label: permLabelMap[key as PermCd],
          value,
        }));

      const search_conditions: SearchCondition[] = [
        {
          key: "search_cd1",
          label: "MyPageデフォルト検索条件1",
          search_cd: search_cd1 as SearchConditionCd,
          value: SearchConditionValMap[search_cd1 as SearchConditionCd],
        },
        {
          key: "search_cd2",
          label: "MyPageデフォルト検索条件2",
          search_cd: search_cd2 as SearchConditionCd,
          value: SearchConditionValMap[search_cd2 as SearchConditionCd],
        },
        {
          key: "search_cd3",
          label: "MyPageデフォルト検索条件3",
          search_cd: search_cd3 as SearchConditionCd,
          value: SearchConditionValMap[search_cd3 as SearchConditionCd],
        },
      ];

      return {
        perm_cd,
        perm_name,
        permissions,
        search_conditions,
      };
    });
  }, [permissionList]);

  const activePerm = useMemo(
    () => displayPermList.find((p) => p.perm_cd === permission),
    [permission, displayPermList],
  );

  const handleUserSave = async () => {
    if (!user_cd) return;
    const errors: string[] = [];
    if (dispName.length > MAX_DISP_LEN) {
      errors.push("表示名の文字数制限を超えています");
    }
    if (account.length > MAX_ACCOUNT_LEN) {
      errors.push("アカウント名の文字数制限を超えています");
    }
    if (mail.length > MAX_EMAIL_LEN) {
      errors.push("メールアドレスの文字数制限を超えています");
    }
    if (errors.length > 0) {
      toast.error(errors.join("\n"));
      return;
    }
    const params: UserUpdateParams = {
      disp_name: dispName,
      account: account,
      email: mail,
      language_code: lang === "ja" ? 0 : lang === "en" ? 1 : undefined,
      center_cd: belonging?.value ?? "",
      perm_cd: permission,
    };
    console.log("実際に送信するデータ:", params);
    const result = await dispatch(updateUserInfo({ userCd: user_cd, params }));
    if (updateUserInfo.fulfilled.match(result)) {
      toast.success("保存しました");
    } else {
      toast.error("保存に失敗しました");
    }
  };

  const handleUserRemove = async () => {
    if (!user_cd) return;
    const result = await dispatch(removeUser(user_cd));
    if (removeUser.fulfilled.match(result)) {
      toast.success(`ユーザー${user_cd}を削除しました`);
    } else {
      toast.error("削除に失敗しました");
    }
  };

  const handleResetSearchCondition = async () => {
    if (!user_cd) return;
    const api = new SearchSetApi(Config.apiConfig);
    try {
      const response = await api.clearSearchSet(user_cd, Config.apiOption);
      if (!response?.data) {
        throw new Error("レスポンスが不正です");
      }
      toast.success("検索条件をリセットしました");
      return response.data;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "不明なエラー";
      toast.error("検索条件のリセットに失敗しました", {
        description: errorMessage,
      });
    }
  };

  const FormSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-full" />
    </div>
  );

  return (
    <>
      {user_cd && (
        <UserTabsShell active="setting">
          <div className="flex gap-6 items-end">
            <h2 className="flex items-center text-left text-base font-semibold">
              <span>ユーザー設定</span>
              <ChevronRight />
              <span>{user_cd}</span>
            </h2>
            <span className="text-muted-foreground text-sm">
              ユーザーの基本情報や権限を編集します
            </span>
          </div>

          <Button variant="outline" size="lg" className="gap-2 px-3 py-3">
            <NavLink className="nav-link" to={UrlPath.UserManage}>
              <div>
                <ChevronLeft size={24} className="mr-1" />
                ユーザー検索へ戻る
              </div>
            </NavLink>
          </Button>
          <Card>
            <CardHeader className="flex gap-6 items-end">
              <p className="font-semibold">ユーザー情報</p>
              <span className="text-muted-foreground text-sm">
                ユーザー情報の編集
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {isLoading ? (
                  <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-gray-300 w-full items-stretch">
                    <div className="lg:flex-1 lg:pr-6 pb-6 lg:pb-0 flex flex-col gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <FormSkeleton key={i} />
                      ))}
                    </div>
                    <div className="lg:flex-1 lg:pl-6 flex flex-col gap-6">
                      <FormSkeleton />
                      <Skeleton className="h-128 w-full rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-gray-300 w-full items-stretch">
                    <div className="lg:flex-1 lg:pr-6 pb-6 lg:pb-0 flex flex-col gap-6">
                      <div className="space-y-4">
                        <Label>ユーザーID</Label>
                        <Input
                          className="text-muted-foreground caret-transparent"
                          value={user_cd}
                          readOnly
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>表示名</Label>
                        <Input
                          value={dispName}
                          onChange={(e) => setDispName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>アカウント名（ドメイン）</Label>
                        <Input
                          value={account}
                          onChange={(e) => setAccount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>メールアドレス</Label>
                        <Input
                          value={mail}
                          onChange={(e) => setMail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>所属センター</Label>
                        <AutoCompleteSingle
                          type="center"
                          value={belonging}
                          placeholder="センターを選択"
                          onChange={(selected) => {
                            setBelonging(selected);
                          }}
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>言語設定</Label>
                        <RadioGroup
                          className="flex items-center gap-3"
                          value={lang}
                          onValueChange={(v) =>
                            setLang(v === "ja" ? "ja" : "en")
                          }
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem id="r1" value="ja" />
                            <Label htmlFor="r1">日本語</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem id="r2" value="en" />
                            <Label htmlFor="r2">英語</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    <div className="lg:flex-1 lg:pl-6 flex flex-col gap-6">
                      <div className="space-y-4">
                        <Label>操作権限</Label>
                        <Select
                          value={permission}
                          onValueChange={(v) => setPermission(v)}
                        >
                          <SelectContent>
                            <SelectGroup>
                              {displayPermList.map((perm) => (
                                <SelectItem
                                  key={perm.perm_cd}
                                  value={perm.perm_cd}
                                >
                                  {perm.perm_cd}
                                  {perm.perm_name ? `(${perm.perm_name})` : ""}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <div className="rounded-xl border p-4 space-y-3 bg-background/60">
                          <div className="flex items-center space-x-4">
                            <p className="text-sm font-medium text-muted-foreground">
                              権限内容
                            </p>
                            <Badge
                              variant="secondary"
                              className="px-3 py-1 rounded-full"
                            >
                              {permission}
                            </Badge>
                          </div>
                          {activePerm && (
                            <>
                              <div className="flex flex-col gap-2 text-sm">
                                {activePerm.search_conditions.map((c) => (
                                  <div
                                    key={c.key}
                                    className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                                  >
                                    <span className="text-foreground/90">
                                      {c.label}
                                    </span>
                                    <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-muted-foreground">
                                      {c.value ? c.value : "なし"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-2 text-sm">
                                {activePerm.permissions.map((p) => (
                                  <div
                                    key={p.key}
                                    className="flex-grow flex-shrink-0 basis-[calc(50%-0.5rem)] min-w-[192px] flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                                  >
                                    <span className="text-foreground/90">
                                      {p.label}
                                    </span>
                                    <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                      {p.value ? (
                                        <Check size={16} />
                                      ) : (
                                        <X size={16} />
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2">
              <Button size="lg" onClick={handleUserSave}>
                保存
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-6 items-start">
                <p className="font-semibold">MyPage検索条件リセット</p>
                <p className="text-muted-foreground text-sm">
                  MyPageの検索条件を初期化します。
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ConFirmButton
                size="lg"
                variant="outline"
                buttonLabel={"リセット"}
                dialogTitle="確認"
                dialogBody={
                  <>ユーザー{user_cd}のマイページ検索条件をリセットしますか？</>
                }
                onHandle={handleResetSearchCondition}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-6 items-start">
                <p className="font-semibold">ユーザー削除</p>
                <p className="text-muted-foreground text-sm">
                  ユーザーを削除します。削除されたユーザーはログインできなくなります。
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex justify-end">
              <ConfirmButton
                size="lg"
                variant="destructive"
                buttonLabel={"削除する"}
                dialogTitle="確認"
                dialogBody={<>ユーザー{user_cd}を削除しますか？</>}
                onHandle={handleUserRemove}
              />
            </CardContent>
          </Card>
        </UserTabsShell>
      )}
    </>
  );
};
