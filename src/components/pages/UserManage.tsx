import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/frame/Layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CustomPagination } from "@/components/parts/Pagination/Pagination";
import { usePagination } from "@/utility/usePagination";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getUserList, userSelector } from "@/redux/slices/userSlice";

type ADUser = {
  account: string;
  email: string;
  name: string;
  registered: boolean;
};

type JclUser = {
  id: string;
  display: string;
  email: string;
  box: string;
  center: string;
  permission: string;
};

const adUsersMock: ADUser[] = [
  { account: "suzuki.taro", email: "taro@example.com", name: "鈴木 太郎", registered: true },
  { account: "yamada.hanako", email: "hanako@example.com", name: "山田 花子", registered: false },
  { account: "ito.jiro", email: "jiro@example.com", name: "伊藤 次郎", registered: false },
];

const jclUsersMock: JclUser[] = [
  { id: "u001", display: "佐藤 健", email: "ken@example.com", box: "box-ken", center: "東京", permission: "標準" },
  { id: "u002", display: "高橋 真由", email: "mayu@example.com", box: "box-mayu", center: "大阪DR", permission: "管理者" },
  { id: "u003", display: "鈴木 太郎", email: "taro@example.com", box: "box-taro", center: "東京", permission: "標準" },
];

const permissionTemplates = ["標準", "閲覧のみ", "管理者", "運用", "監査"];

const UserManage = () => {
  const [tab, setTab] = useState<"new" | "edit">("edit");
  // 新規登録 検索条件
  const [accountKeyword, setAccountKeyword] = useState("");
  const [emailKeyword, setEmailKeyword] = useState("");
  // 既存編集 検索条件
  const [displayKeyword, setDisplayKeyword] = useState("");
  const [userIdKeyword, setUserIdKeyword] = useState("");
  const [userEmailKeyword, setUserEmailKeyword] = useState("");
  const [centerKeyword, setCenterKeyword] = useState("");

  const [selected, setSelected] = useState<JclUser | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("標準");
  const [langJa, setLangJa] = useState(true);
  const [newSearched, setNewSearched] = useState(false);
  const [editSearched, setEditSearched] = useState(false);

  const dispatch = useAppDispatch();
  const savedCondition = useAppSelector(userSelector.searchConditionSelector());
  const userList = useAppSelector(userSelector.userListSelector());

  // フォーム初期値を savedCondition で復元
  useEffect(() => {
    if (savedCondition) {
      setDisplayKeyword(savedCondition.user_name ?? "");
      setUserIdKeyword(savedCondition.user_account ?? "");
      setUserEmailKeyword(savedCondition.user_email ?? "");
      setCenterKeyword(savedCondition.center_cd_list?.[0] ?? "");
      setEditSearched(true);
    }
  }, [savedCondition]);

  const filteredAd = useMemo(
    () =>
      adUsersMock.filter(
        (u) =>
          (accountKeyword ? u.account.includes(accountKeyword) : true) &&
          (emailKeyword ? u.email.includes(emailKeyword) : true),
      ),
    [accountKeyword, emailKeyword],
  );

  const jclRecords = useMemo(() => userList?.data ?? [], [userList]);

  const adPagination = usePagination(filteredAd, 10);
  const jclPagination = usePagination(jclRecords, userList?.pagination?.per_page ?? 10);

  const handleUserSearch = (page = 1, per = jclPagination.perPage) => {
    const params = {
      user_name: displayKeyword || undefined,
      user_account: userIdKeyword || undefined,
      user_email: userEmailKeyword || undefined,
      center_cd_list: centerKeyword ? [centerKeyword] : undefined,
      page,
      per_page: per,
    };
    dispatch(getUserList(params as any));
    setEditSearched(true);
    setSelected(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">ユーザー設定</h1>
          <p className="text-sm text-muted-foreground">
            ADユーザーの取り込みと、JCLユーザーの検索・編集を1ページで。
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="edit">既存ユーザー編集</TabsTrigger>
            <TabsTrigger value="new">新規登録（AD連携）</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ADユーザー検索</CardTitle>
                <CardDescription>アカウント名 / メールアドレスで検索し、未登録なら登録できます。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2 min-w-[240px] flex-1">
                    <Label htmlFor="account">アカウント名</Label>
                    <Input
                      id="account"
                      placeholder="例: suzuki.taro"
                      value={accountKeyword}
                      onChange={(e) => setAccountKeyword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 min-w-[260px] flex-1">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      placeholder="例: user@example.com"
                      value={emailKeyword}
                      onChange={(e) => setEmailKeyword(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end gap-2 justify-end">
                    <Button variant="secondary" className="whitespace-nowrap">
                      ADユーザー更新
                    </Button>
                    <Button
                      className="whitespace-nowrap"
                      onClick={() => setNewSearched(true)}
                    >
                      検索
                    </Button>
                  </div>
                </div>

                {newSearched && (
                  <div className="space-y-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>アカウント</TableHead>
                          <TableHead>氏名</TableHead>
                          <TableHead>メール</TableHead>
                          <TableHead>JCL登録状況</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adPagination.items.map((u) => (
                          <TableRow key={u.account}>
                            <TableCell>{u.account}</TableCell>
                            <TableCell>{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              {u.registered ? (
                                <Badge variant="outline">登録済み</Badge>
                              ) : (
                                <Badge variant="secondary">未登録</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant={u.registered ? "ghost" : "default"}>
                                {u.registered ? "登録済" : "登録"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <CustomPagination
                      page={adPagination.page}
                      perPage={adPagination.perPage}
                      total={adPagination.total}
                      onPageChange={adPagination.setPage}
                      onPerPageChange={adPagination.setPerPage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <Card className="xl:mb-0 shadow-sm">
                <CardHeader>
                  <CardTitle>ユーザー検索</CardTitle>
                  <CardDescription>表示名 / ユーザーID / メール / センターで絞り込み。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-2 min-w-[220px] flex-1">
                      <Label>表示名</Label>
                      <Input
                        placeholder="例: 鈴木"
                        value={displayKeyword}
                        onChange={(e) => setDisplayKeyword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 min-w-[180px] flex-[0.8]">
                      <Label>ユーザーID</Label>
                      <Input
                        placeholder="例: u001"
                        value={userIdKeyword}
                        onChange={(e) => setUserIdKeyword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 min-w-[240px] flex-1">
                      <Label>メールアドレス</Label>
                      <Input
                        placeholder="例: user@example.com"
                        value={userEmailKeyword}
                        onChange={(e) => setUserEmailKeyword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 min-w-[220px] flex-1">
                      <Label>センター（Autocomplete想定）</Label>
                      <Input
                        placeholder="例: 東京"
                        value={centerKeyword}
                        onChange={(e) => setCenterKeyword(e.target.value)}
                      />
                    </div>
                  </div>

                    <div className="rounded-lg border bg-card/50 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        検索結果 {userList?.pagination?.total ?? jclRecords.length} 件
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setDisplayKeyword("");
                          setUserIdKeyword("");
                          setUserEmailKeyword("");
                          setCenterKeyword("");
                          setEditSearched(false);
                          setSelected(null);
                        }}>
                          クリア
                        </Button>
                        <Button size="sm" onClick={() => handleUserSearch(jclPagination.page, jclPagination.perPage)}>再検索</Button>
                      </div>
                    </div>
                    {editSearched && (
                      <div className="space-y-3">
                        <div className="max-h-[420px] overflow-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                                <TableHead>ユーザーID</TableHead>
                                <TableHead>表示名</TableHead>
                                <TableHead>メール</TableHead>
                                <TableHead>BOX</TableHead>
                                <TableHead>センター</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                        {jclPagination.items.map((u: any) => (
                            <TableRow key={u.user?.user_cd ?? u.id} className="last:border-0">
                              <TableCell>{u.user?.user_cd ?? u.id}</TableCell>
                              <TableCell>{u.user?.user_name ?? u.display}</TableCell>
                              <TableCell>{u.user?.email ?? u.email}</TableCell>
                              <TableCell>{u.user?.box_account ?? u.box}</TableCell>
                              <TableCell>{u.user?.center ?? u.center}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="secondary" onClick={() => setSelected(u)}>
                                  選択
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                            </TableBody>
                          </Table>
                        </div>
                        <CustomPagination
                          pagination={{
                            page: userList?.pagination?.page ?? jclPagination.page,
                            per_page: userList?.pagination?.per_page ?? jclPagination.perPage,
                            total: userList?.pagination?.total ?? jclPagination.total,
                          }}
                          onPageChange={(p) => handleUserSearch(p, userList?.pagination?.per_page ?? jclPagination.perPage)}
                          onPerPageChange={(per) => handleUserSearch(1, per)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selected && (
              <Card className="xl:sticky xl:top-20 h-fit shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>登録情報</CardTitle>
                    <CardDescription>選択したユーザーの詳細を編集できます。</CardDescription>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setSelected(null)}
                    aria-label="閉じる"
                  >
                    ×
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-3">
                    <Label>ユーザーID</Label>
                    <Input value={selected?.user?.user_cd ?? selected?.id ?? ""} readOnly />
                    <Label>表示名</Label>
                    <Input value={selected?.user?.user_name ?? selected?.display ?? ""} />
                    <Label>アカウント名（ドメイン）</Label>
                    <Input value={(selected?.user?.email ?? selected?.email ?? "").split("@")[0]} />
                    <Label>メールアドレス</Label>
                    <Input value={selected?.user?.email ?? selected?.email ?? ""} />
                    <div className="flex items-start justify-between rounded-md border p-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">言語設定</Label>
                        <p className="text-xs text-muted-foreground">日本語 / 英語</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">EN</span>
                        <Switch checked={langJa} onCheckedChange={setLangJa} />
                        <span className="text-xs font-medium">JA</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>所属センター</Label>
                    <Input placeholder="センターを選択" defaultValue={selected?.user?.center ?? selected?.center ?? ""} />
                    <Label>操作権限テンプレート</Label>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                    >
                      {permissionTemplates.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                    <div className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">権限内容</span>
                        <Badge variant="outline">{selectedTemplate}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>ジョブ作成: 可</span>
                        <span>ステータス編集: 可</span>
                        <span>ログ検索: 可</span>
                        <span>アクセスユーザー設定: 可</span>
                        <span>管理メニュー: 不可</span>
                        <span>自動削除フォルダ設定: 不可</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button>保存</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserManage;
export { UserManage };
