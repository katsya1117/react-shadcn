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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { UrlPath } from "@/constant/UrlPath";
import { useNavigate } from "react-router";

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
  // 登録 検索条件
  const [accountKeyword, setAccountKeyword] = useState("");
  const [emailKeyword, setEmailKeyword] = useState("");
  // 編集 検索条件
  const [displayKeyword, setDisplayKeyword] = useState("");
  const [userIdKeyword, setUserIdKeyword] = useState("");
  const [userEmailKeyword, setUserEmailKeyword] = useState("");
  const [centerKeyword, setCenterKeyword] = useState("");

  const [newSearched, setNewSearched] = useState(false);
  const [editSearched, setEditSearched] = useState(false);
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ key: "id" | "display" | "email" | "box" | "center"; order: "asc" | "desc" } | null>(null);

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

  // 条件が変わらない限り検索結果をそのまま使いたいので useMemo
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

  const sortedRecords = useMemo(() => {
    if (!sort) return jclRecords;
    const arr = [...jclRecords];
    const { key, order } = sort;
    const dir = order === "asc" ? 1 : -1;
    arr.sort((a: any, b: any) => {
      const av = (a.user?.user_cd ?? a.id ?? "") + "";
      const bv = (b.user?.user_cd ?? b.id ?? "") + "";
      const map: Record<typeof key, [any, any]> = {
        id: [av, bv],
        display: [a.user?.user_name ?? a.display ?? "", b.user?.user_name ?? b.display ?? ""],
        email: [a.user?.email ?? a.email ?? "", b.user?.email ?? b.email ?? ""],
        box: [a.user?.box_account ?? a.box ?? "", b.user?.box_account ?? b.box ?? ""],
        center: [a.user?.center ?? a.center ?? "", b.user?.center ?? b.center ?? ""],
      };
      const [va, vb] = map[key];
      return va.localeCompare(vb, "ja") * dir;
    });
    return arr;
  }, [jclRecords, sort]);

  const adPagination = usePagination(filteredAd, 10);
  const jclPagination = usePagination(sortedRecords, userList?.pagination?.per_page ?? 10);

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
    setSort(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">ユーザー設定</h1>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="edit">編集</TabsTrigger>
            <TabsTrigger value="new">登録（AD連携）</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ADユーザーを検索</CardTitle>
                <CardDescription></CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible defaultValue="cond-new">
                  <AccordionItem value="cond-new">
                    <AccordionTrigger>検索条件</AccordionTrigger>
                    <AccordionContent>
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

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
            <div className="space-y-5">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>ユーザー検索</CardTitle>
                  <CardDescription>表示名 / ユーザーID / メール / センターで絞り込み。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Accordion type="single" collapsible defaultValue="cond-edit">
                    <AccordionItem value="cond-edit">
                      <AccordionTrigger>検索条件</AccordionTrigger>
                      <AccordionContent>
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

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
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "id" && prev.order === "asc" ? { key: "id", order: "desc" } : { key: "id", order: "asc" })}>
                                  ユーザーID
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "display" && prev.order === "asc" ? { key: "display", order: "desc" } : { key: "display", order: "asc" })}>
                                  表示名
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "email" && prev.order === "asc" ? { key: "email", order: "desc" } : { key: "email", order: "asc" })}>
                                  メール
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "box" && prev.order === "asc" ? { key: "box", order: "desc" } : { key: "box", order: "asc" })}>
                                  BOX
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "center" && prev.order === "asc" ? { key: "center", order: "desc" } : { key: "center", order: "asc" })}>
                                  センター
                                </TableHead>
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
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    const userId = (u as any).user?.user_cd ?? u.id;
                                    if (userId) {
                                      navigate(UrlPath.UserEdit.replace(":user_cd", userId));
                                    }
                                  }}
                                >
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

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserManage;
export { UserManage };
