import { useMemo, useState } from "react";
import { Layout } from "@/components/frame/Layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Template = {
  id: string;
  name: string;
  defaults: [string, string, string];
  flags: Record<string, boolean>;
};

const templatesMock: Template[] = [
  {
    id: "standard",
    name: "標準",
    defaults: ["条件A", "条件B", "条件C"],
    flags: {
      createJob: true,
      editStatus: true,
      importStatus: false,
      changeRetention: false,
      editAttribute: true,
      reprint: true,
      accessUser: false,
      userIdentify: false,
      logSearch: true,
      ngWord: false,
      manageMenu: false,
      autoDelete: false,
    },
  },
  {
    id: "admin",
    name: "管理者",
    defaults: ["条件A", "条件A", "条件A"],
    flags: {
      createJob: true,
      editStatus: true,
      importStatus: true,
      changeRetention: true,
      editAttribute: true,
      reprint: true,
      accessUser: true,
      userIdentify: true,
      logSearch: true,
      ngWord: true,
      manageMenu: true,
      autoDelete: true,
    },
  },
];

const flagLabels: { key: keyof Template["flags"]; label: string }[] = [
  { key: "createJob", label: "ジョブ作成" },
  { key: "editStatus", label: "ステータス編集" },
  { key: "importStatus", label: "ステータスインポート" },
  { key: "changeRetention", label: "保管期限変更" },
  { key: "editAttribute", label: "JOB属性編集" },
  { key: "reprint", label: "再版" },
  { key: "accessUser", label: "アクセスユーザー設定" },
  { key: "userIdentify", label: "ユーザー特定設定" },
  { key: "logSearch", label: "ログ検索" },
  { key: "ngWord", label: "NGワード" },
  { key: "manageMenu", label: "管理メニュー" },
  { key: "autoDelete", label: "自動削除フォルダー設定" },
];

const RoleManage = () => {
  const [selectedId, setSelectedId] = useState<string>("standard");
  const [name, setName] = useState("標準");
  const [defaults, setDefaults] = useState(["条件A", "条件B", "条件C"]);
  const [flags, setFlags] = useState<Template["flags"]>(templatesMock[0].flags);

  const isNew = selectedId === "new";

  const selectedTemplate = useMemo(
    () => templatesMock.find((t) => t.id === selectedId),
    [selectedId],
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (id === "new") {
      setName("新しい権限");
      setDefaults(["", "", ""]);
      setFlags(
        Object.fromEntries(
          flagLabels.map(({ key }) => [key, false]),
        ) as Template["flags"],
      );
    } else if (selectedTemplate) {
      setName(selectedTemplate.name);
      setDefaults([...selectedTemplate.defaults]);
      setFlags({ ...selectedTemplate.flags });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">アクセスユーザー設定</h1>
          <p className="text-sm text-muted-foreground">
            操作権限テンプレートの新規作成・編集を行います。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>テンプレート選択</CardTitle>
            <CardDescription>
              既存を編集するか、新規を追加します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label>操作権限</Label>
                <Select
                  value={selectedId}
                  onChange={(e) => handleSelect(e.target.value)}
                >
                  {templatesMock.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  <option value="new">新規</option>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Badge variant="secondary">{isNew ? "新規作成" : "編集"}</Badge>
                <Button>保存</Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <Label>操作権限ラベル</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
                <Label>MyPageデフォルト検索条件1</Label>
                <Select
                  value={defaults[0]}
                  onChange={(e) =>
                    setDefaults([e.target.value, defaults[1], defaults[2]])
                  }
                >
                  <option value="">未設定</option>
                  <option value="条件A">条件A</option>
                  <option value="条件B">条件B</option>
                  <option value="条件C">条件C</option>
                </Select>
                <Label>MyPageデフォルト検索条件2</Label>
                <Select
                  value={defaults[1]}
                  onChange={(e) =>
                    setDefaults([defaults[0], e.target.value, defaults[2]])
                  }
                >
                  <option value="">未設定</option>
                  <option value="条件A">条件A</option>
                  <option value="条件B">条件B</option>
                  <option value="条件C">条件C</option>
                </Select>
                <Label>MyPageデフォルト検索条件3</Label>
                <Select
                  value={defaults[2]}
                  onChange={(e) =>
                    setDefaults([defaults[0], defaults[1], e.target.value])
                  }
                >
                  <option value="">未設定</option>
                  <option value="条件A">条件A</option>
                  <option value="条件B">条件B</option>
                  <option value="条件C">条件C</option>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {flagLabels.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span>{label}</span>
                      <Switch
                        checked={!!flags[key]}
                        onCheckedChange={(v) =>
                          setFlags({ ...flags, [key]: v })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RoleManage;
export { RoleManage };
