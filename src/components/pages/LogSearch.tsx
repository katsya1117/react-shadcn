import { useMemo, useState } from "react";
import Layout from "@/components/frame/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CustomPagination } from "../parts/Pagination/Pagination";
import { AutoCompleteMulti } from "../parts/AutoComplete/AutoCompleteMulti";
import type { MultiValue } from "react-select";
import type { AutoCompleteData } from "@/api";

type LogEntry = {
  datetime: string;
  user: string;
  jobName: string;
  rerun: number;
  action: string;
  detail: string;
  beforeStatus?: string;
  afterStatus?: string;
};

const mockLogs: LogEntry[] = [
  {
    datetime: "2026-01-24 10:31",
    user: "sre-user",
    jobName: "月次請求バッチ",
    rerun: 0,
    action: "実行",
    detail: "ジョブを手動実行",
    beforeStatus: "待機",
    afterStatus: "実行中",
  },
  {
    datetime: "2026-01-24 11:02",
    user: "ops-admin",
    jobName: "ログ圧縮",
    rerun: 1,
    action: "再実行",
    detail: "失敗ジョブを再実行",
    beforeStatus: "失敗",
    afterStatus: "待機",
  },
  {
    datetime: "2026-01-25 09:10",
    user: "dev-lead",
    jobName: "人事マスタ同期",
    rerun: 0,
    action: "設定変更",
    detail: "cron を 2:00→1:00 に変更",
    beforeStatus: "完了",
    afterStatus: "待機",
  },
];

const actionOptions = ["実行", "再実行", "設定変更", "キャンセル"];
const statusOptions = ["実行中", "待機", "完了", "失敗"];

const LogSearch = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [users, setUsers] = useState<MultiValue<AutoCompleteData>>([]);
  const [action, setAction] = useState("");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [jobName, setJobName] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      if (from && log.datetime < from) return false;
      if (to && log.datetime > `${to} 23:59`) return false;
      if (users.length && !users.some((u) => u.label === log.user)) return false;
      if (action && log.action !== action) return false;
      if (before && log.beforeStatus !== before) return false;
      if (after && log.afterStatus !== after) return false;
      if (jobName && !log.jobName.includes(jobName)) return false;
      return true;
    });
  }, [from, to, users, action, before, after, jobName]);

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSearch = () => setPage(1);

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>LOG SEARCH</CardTitle>
          <CardDescription>操作ログを検索・参照する画面</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>期間 From</Label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <Label>期間 To</Label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>ユーザー選択</Label>
                <AutoCompleteMulti
                  value={users}
                  type="user"
                  placeholder="ユーザーを選択"
                  onChange={(v) => setUsers(v)}
                />
                <div className="flex gap-2 text-xs text-muted-foreground pt-1">
                  <button className="underline" onClick={() => setUsers([])}>
                    全選択解除
                  </button>
                </div>
              </div>
              <div>
                <Label>操作種別</Label>
                <Select value={action} onChange={(e) => setAction(e.target.value)}>
                  <option value="">すべて</option>
                  {actionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>変更前ステータス</Label>
                  <Select value={before} onChange={(e) => setBefore(e.target.value)}>
                    <option value="">すべて</option>
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>変更後ステータス</Label>
                  <Select value={after} onChange={(e) => setAfter(e.target.value)}>
                    <option value="">すべて</option>
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>JOB名称</Label>
                <Input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="部分一致" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSearch}>検索する</Button>
            </div>
          </div>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">検索結果</CardTitle>
              <CardDescription>{total} 件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">作業日時</th>
                      <th className="px-3 py-2 text-left">ユーザー</th>
                      <th className="px-3 py-2 text-left">JOB名</th>
                      <th className="px-3 py-2 text-left">再版回数</th>
                      <th className="px-3 py-2 text-left">操作種別</th>
                      <th className="px-3 py-2 text-left">操作内容</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paged.length === 0 && (
                      <tr>
                        <td className="px-3 py-4 text-center text-muted-foreground" colSpan={6}>
                          データはありません
                        </td>
                      </tr>
                    )}
                    {paged.map((log, idx) => (
                      <tr key={`${log.datetime}-${idx}`} className="bg-background">
                        <td className="px-3 py-2">{log.datetime}</td>
                        <td className="px-3 py-2">{log.user}</td>
                        <td className="px-3 py-2">{log.jobName}</td>
                        <td className="px-3 py-2">{log.rerun}</td>
                        <td className="px-3 py-2">{log.action}</td>
                        <td className="px-3 py-2">{log.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pt-2">
                <CustomPagination
                  page={page}
                  perPage={perPage}
                  total={total}
                  onPageChange={setPage}
                  onPerPageChange={() => {}}
                />
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default LogSearch;
export { LogSearch };
