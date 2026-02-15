import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomPagination } from "@/components/parts/Pagination/Pagination";
import { usePagination } from "@/utility/usePagination";
import { UserTabsShell } from "@/components/pages/UserTabsShell";
import type { Pagination } from "@/api";
import { toast } from "@/components/ui/sonner";

type ADUser = {
  account: string;
  email: string;
  name: string;
  registered: boolean;
};

const MAX_ACCOUNT_LEN = 100;
const MAX_EMAIL_LEN = 254; // RFCで一般的に使われる上限

const adUsersMock: ADUser[] = Array.from({ length: 24 }).map((_, i) => {
  const id = i + 1;
  const registered = id % 4 === 0;
  return {
    // id 2 は意図的に文字数超過のダミー
    account:
      id === 2
        ? "u".repeat(MAX_ACCOUNT_LEN + 5)
        : `user${id.toString().padStart(3, "0")}`,
    email:
      id === 2
        ? `${"verylong".repeat(40)}@example.com`
        : `user${id.toString().padStart(3, "0")}@example.com`,
    name: `利用者 ${id.toString().padStart(3, "0")}`,
    registered,
  };
});

const UserCreate = () => {
  const [accountKeyword, setAccountKeyword] = useState("");
  const [emailKeyword, setEmailKeyword] = useState("");
  const [newSearched, setNewSearched] = useState(false);

  const filteredAd = useMemo(
    () =>
      adUsersMock.filter(
        (u) =>
          (accountKeyword ? u.account.includes(accountKeyword) : true) &&
          (emailKeyword ? u.email.includes(emailKeyword) : true),
      ),
    [accountKeyword, emailKeyword],
  );

  const adPagination = usePagination(filteredAd, 10);

  const pagination = useMemo<Pagination>(() => {
    const { page, perPage, total } = adPagination;
    const last = Math.max(1, Math.ceil(total / (perPage || 1)));
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(total, page * perPage);
    const url = (p: number | null) => (p ? `/api/ad-users?page=${p}&per_page=${perPage}` : null);
    return {
      current_page: page,
      last_page: last,
      per_page: perPage,
      from,
      to,
      total,
      first_page_url: url(1)!,
      prev_page_url: url(page > 1 ? page - 1 : null),
      next_page_url: url(page < last ? page + 1 : null),
      last_page_url: url(last)!,
    };
  }, [adPagination.page, adPagination.perPage, adPagination.total]);

  const handlePagination = (params: Record<string, string>) => {
    const nextPer = Number(params.per_page ?? pagination.per_page) || pagination.per_page;
    const nextPage = Number(params.page ?? pagination.current_page) || pagination.current_page;
    if (nextPer !== adPagination.perPage) {
      adPagination.setPerPage(nextPer);
    }
    adPagination.setPage(nextPage);
    setNewSearched(true);
  };

  return (
    <UserTabsShell active="new">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>ADユーザーを検索</CardTitle>
            <CardDescription>検索してダミーのADユーザーリストを表示します。</CardDescription>
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
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>検索結果 {pagination.total} 件</span>
                  <span>
                    {pagination.from} - {pagination.to} / {pagination.total}
                  </span>
                </div>
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
                    {adPagination.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                          該当するADユーザーが見つかりませんでした。
                        </TableCell>
                      </TableRow>
                    )}
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
                          <Button
                            size="sm"
                            variant={u.registered ? "ghost" : "default"}
                            onClick={() => {
                              const errors: string[] = [];
                              if (u.account.length > MAX_ACCOUNT_LEN) {
                                errors.push(`アカウントは${MAX_ACCOUNT_LEN}文字以内`);
                              }
                              if (u.email.length > MAX_EMAIL_LEN) {
                                errors.push(`メールアドレスは${MAX_EMAIL_LEN}文字以内`);
                              }

                              if (errors.length) {
                                toast.error("入力値が長すぎます", {
                                  description: errors.join(" / "),
                                });
                                return;
                              }

                              // 実際にはここで POST。失敗時は catch で toast.error を出す想定。
                              toast.success("登録しました", {
                                description: `${u.name} (${u.account}) を登録しました。`,
                              });
                            }}
                          >
                            {u.registered ? "登録済" : "登録"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <CustomPagination
                  pagination={pagination}
                  onHandle={handlePagination}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserTabsShell>
  );
};

export default UserCreate;
export { UserCreate };
