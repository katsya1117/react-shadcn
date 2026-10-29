import { LoadingOverlay } from "@/components/common/LoadingOverlay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { UrlPath } from "@/constants/UrlPath";
import { CenterTabsShell } from "@/pages/CenterTabsShell";
import { createCenter } from "@/redux/slices/centerSlice";
import type { AppDispatch } from "@/redux/store";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

const CenterCreate = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();

  const [centerName, setCenterName] = useState("");
  const [site, setSite] = useState("");
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const trimmedName = centerName.trim();
    if (!trimmedName) {
      toast.error("センター名を入力してください");
      return;
    }
    setIsCreating(true);
    try {
      const centerCd = await dispatch(
        createCenter({
          center_name: trimmedName,
          site: site.trim(),
          folder_name: folderName.trim(),
        }),
      ).unwrap();
      toast.success("センターを作成しました", {
        description: `${trimmedName} (${centerCd}) を作成しました。`,
      });
      navigate(UrlPath.CenterEdit.replace(":center_cd", centerCd));
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "センターの作成に失敗しました",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <CenterTabsShell active="new">
      <Card>
        <CardHeader>
          <CardTitle>センター作成</CardTitle>
          <CardDescription>新しいセンターを登録します。</CardDescription>
        </CardHeader>
        <CardContent>
          {isCreating && <LoadingOverlay />}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                <Label htmlFor="createCenterName">センター名</Label>
                <Input
                  id="createCenterName"
                  placeholder="例: 東京センター"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                />
              </div>
              <div className="space-y-1 w-full md:w-[calc(50%-8px)]">
                <Label htmlFor="createCenterSite">拠点</Label>
                <Input
                  id="createCenterSite"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                />
              </div>
              <div className="space-y-1 w-full">
                <Label htmlFor="createCenterFolder">フォルダ名</Label>
                <Input
                  id="createCenterFolder"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isCreating}>
                作成
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </CenterTabsShell>
  );
};

export default CenterCreate;
export { CenterCreate };
