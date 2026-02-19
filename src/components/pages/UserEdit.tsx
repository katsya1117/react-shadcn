import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { List, Check, X } from "lucide-react";
import { UserTabsShell } from "@/components/pages/UserTabsShell";
import { UrlPath } from "@/constant/UrlPath";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getUserInfo, updateUserInfo, userSelector } from "@/redux/slices/userSlice";
import { AutoCompleteSingle } from "@/components/parts/AutoComplete/AutoCompleteSingle";
import type { AutoCompleteData } from "@/api";

const permissionTemplates = ["標準", "閲覧のみ", "管理者", "運用", "監査"];

const UserEdit = () => {
  const { user_cd } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(userSelector.loginUserSelector());
  const isLoading = useAppSelector(userSelector.isLoadingSelector());
  // ユーザーごとの編集中センター値。未編集なら null のまま。
  const [centerDraft, setCenterDraft] = useState<{ userId: string; value: string } | null>(null);

  useEffect(() => {
    if (user_cd) {
      dispatch(getUserInfo(user_cd));
    }
  }, [dispatch, user_cd]);

  const u = userInfo?.user;
  if (!u) {
    return (
      <UserTabsShell active="edit">
        <div className="p-4 text-sm text-muted-foreground">読込中...</div>
      </UserTabsShell>
    );
  }

  const userName = u.user_name ?? "";
  const userId = u.user_cd ?? user_cd ?? "";
  const email = u.email ?? "";
  const serverCenter = u.center ?? "";
  const template = "標準";

  const effectiveCenter =
    centerDraft && centerDraft.userId === userId ? centerDraft.value : serverCenter;

  const centerOption: AutoCompleteData | null = effectiveCenter
    ? { label: effectiveCenter, value: effectiveCenter }
    : null;

  const centerValue = effectiveCenter;
  const centerLabel = effectiveCenter || "-";

  const handleSaveBasic = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) {
      toast.error("ユーザーIDが不正です");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const nextUserName = String(formData.get("user_name") ?? "").trim();
    const nextEmail = String(formData.get("email") ?? "").trim();

    if (!nextUserName) {
      toast.error("表示名を入力してください");
      return;
    }

    const action = await dispatch(
      updateUserInfo({
        user_cd: userId,
        user_name: nextUserName,
        email: nextEmail || undefined,
        center: centerValue || undefined,
      })
    );

    if (updateUserInfo.fulfilled.match(action) && action.payload) {
      toast.success("基本設定を保存しました");
      return;
    }

    toast.error("保存に失敗しました");
  };

  return (
    <UserTabsShell active="edit">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-3"
              onClick={() => navigate(UrlPath.UserManage)}
            >
              <List className="h-4 w-4" />
              ユーザー一覧へ戻る
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-semibold">{userName || "ユーザー詳細"}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">ユーザーID: {userId}</Badge>
              <span className="rounded-full bg-muted px-3 py-1 text-foreground/70">
                所属 {centerLabel}
              </span>
            </div>
          </div>
        </div>

        {/* カードはすべて縦並びにする */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本設定</CardTitle>
              <CardDescription>ユーザーの基本属性を編集します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form className="space-y-3" onSubmit={handleSaveBasic}>
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                    <Label>ユーザーID</Label>
                    <Input name="user_cd" value={userId} readOnly />
                  </div>
                  <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                    <Label>表示名</Label>
                    <Input name="user_name" defaultValue={userName} />
                  </div>
                  <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                    <Label>アカウント名（ドメイン）</Label>
                    <Input name="user_account" defaultValue={email.split("@")[0] ?? ""} />
                  </div>
                  <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                    <Label>メールアドレス</Label>
                    <Input name="email" defaultValue={email} />
                  </div>
                  <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                    <Label>所属センター</Label>
                  <AutoCompleteSingle
                    type="center"
                    value={centerOption}
                    placeholder="センターを選択"
                    onChange={(v) => {
                      setCenterDraft(v?.value ?? "");
                    }}
                  />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" type="submit" disabled={isLoading}>
                    {isLoading ? "保存中..." : "保存"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">言語設定</CardTitle>
              <CardDescription>UI言語のデフォルトを切り替えます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between rounded-md border p-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">言語設定</Label>
                  <p className="text-xs text-muted-foreground">日本語 / 英語</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">EN</span>
                  <Switch defaultChecked />
                  <span className="text-xs font-medium">JA</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm">保存</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">権限設定</CardTitle>
              <CardDescription>所属と権限テンプレートを管理します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Select defaultValue={template}>
                  {permissionTemplates.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">権限内容</p>
                    <p className="text-xs text-muted-foreground">テンプレートに紐づく権限の一覧です</p>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1 rounded-full">
                    {template}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {[
                    { label: "ジョブ作成", ok: true },
                    { label: "ステータス編集", ok: true },
                    { label: "ログ検索", ok: true },
                    { label: "アクセスユーザー設定", ok: true },
                    { label: "管理メニュー", ok: false },
                    { label: "自動削除フォルダ設定", ok: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 w-full sm:w-[calc(50%-4px)]"
                    >
                      <span className="text-foreground/90">{item.label}</span>
                      <span
                        className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                        aria-label={item.ok ? "許可" : "禁止"}
                      >
                        {item.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button>保存</Button>
              </div>
            </CardContent>
          </Card>

          {/* 削除 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-destructive">ユーザー削除</CardTitle>
              <CardDescription>このユーザーを削除すると元に戻せません。</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">削除する</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      {userName || "ユーザー"}（ID: {userId}）を削除します。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        toast(`${userName || userId} を削除しました`);
                        navigate(UrlPath.UserManage);
                      }}
                    >
                      削除する
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserTabsShell>
  );
};

export default UserEdit;
export { UserEdit };
