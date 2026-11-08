import { SHARE_AREAS } from "@/config/shareAreaConfig";
import type { SharedAreaItem, SharedAreaRole } from "../index";

/**
 * 他センターから共有されたフォルダの、モック DB。
 * 設計は docs/design-sharearea-launcher.md の「3. DB の構成」を参照。
 *
 * - SharedFolderRow : 共有されたフォルダ（フォルダ ID で重複なし）。夜間バッチが名前・経路・状態を更新する
 * - ShareGrantRow   : 共有の付与（コラボレーションごと）。誰に、どの権限か
 */
type SharedFolderRow = {
  folder_id: string;
  center_folder_id: string;
  folder_name: string;
  /** センターより下の名前の並び（共有されたフォルダ自身を除く） */
  path_names: string[];
  status: "ok" | "missing";
};

type ShareGrantRow = {
  collaboration_id: string;
  folder_id: string;
  principal_type: "user" | "group";
  principal_id: string;
  role: SharedAreaRole;
};

/** 所属していないセンター（共有元）のフォルダ ID → 名前。本番はセンターのフォルダ名を DB から引く */
const centerNames: Record<string, string> = {
  "370700000001": "JCLGD2SWDV",
  "370700000002": "JCLGD3NW",
};

/** センターのフォルダ ID → 表示名（「〇〇センター」） */
const centerLabels: Record<string, string> = {
  "370700000001": "第2ソフトウェア開発センター",
  "370700000002": "第3ネットワークセンター",
};

const sharedFolders: SharedFolderRow[] = [
  {
    folder_id: "370710000001",
    center_folder_id: "370700000001",
    folder_name: "見積資料",
    path_names: ["2024年度", "営業部", "案件A"],
    status: "ok",
  },
  {
    folder_id: "370710000002",
    center_folder_id: "370700000001",
    folder_name: "契約書",
    path_names: ["2024年度", "法務"],
    status: "ok",
  },
  {
    folder_id: "370710000003",
    center_folder_id: "370700000002",
    folder_name: "設計図",
    path_names: [],
    status: "ok",
  },
  {
    folder_id: "370710000004",
    center_folder_id: "370700000002",
    folder_name: "検証環境の手順書",
    path_names: ["2023年度", "インフラ", "運用", "手順", "検証環境", "旧版"],
    status: "missing",
  },
  // 動作確認用（mock-user のみ。件数が多いときの「すべて表示」「絞り込み」を確かめる）
  {
    folder_id: "370710000011",
    center_folder_id: "370700000001",
    folder_name: "議事録",
    path_names: ["2024年度", "営業部"],
    status: "ok",
  },
  {
    folder_id: "370710000012",
    center_folder_id: "370700000002",
    folder_name: "ネットワーク構成図",
    path_names: ["2024年度", "インフラ"],
    status: "ok",
  },
  {
    folder_id: "370710000013",
    center_folder_id: "370700000002",
    folder_name: "障害報告",
    path_names: ["2024年度", "インフラ", "運用", "報告", "障害"],
    status: "ok",
  },
  // 所属しているセンター宛ての共有。一覧には出ない（所属のカードから開ける）
  {
    folder_id: "370710000005",
    center_folder_id: SHARE_AREAS[0].boxFolderId,
    folder_name: "共有メモ",
    path_names: [],
    status: "ok",
  },
];

const shareGrants: ShareGrantRow[] = [
  // ユーザー宛て
  {
    collaboration_id: "g-1",
    folder_id: "370710000001",
    principal_type: "user",
    principal_id: "u001",
    role: "editor",
  },
  // グループ宛て。同じフォルダに、ユーザー宛て（editor）とグループ宛て（viewer）が重なる → 強いロールを採用
  {
    collaboration_id: "g-2",
    folder_id: "370710000001",
    principal_type: "group",
    principal_id: "grp-dev",
    role: "viewer",
  },
  {
    collaboration_id: "g-3",
    folder_id: "370710000002",
    principal_type: "group",
    principal_id: "grp-dev",
    role: "viewer",
  },
  {
    collaboration_id: "g-4",
    folder_id: "370710000003",
    principal_type: "user",
    principal_id: "u001",
    role: "viewer",
  },
  {
    collaboration_id: "g-5",
    folder_id: "370710000004",
    principal_type: "user",
    principal_id: "u001",
    role: "viewer",
  },
  {
    collaboration_id: "g-6",
    folder_id: "370710000005",
    principal_type: "user",
    principal_id: "u001",
    role: "editor",
  },
  // 動作確認用（既定のモックユーザー。ユーザー宛て・グループ宛て・見つからない状態・長い経路を一通り含む）
  {
    collaboration_id: "g-7",
    folder_id: "370710000003",
    principal_type: "user",
    principal_id: "mock-user",
    role: "editor",
  },
  {
    collaboration_id: "g-11",
    folder_id: "370710000011",
    principal_type: "user",
    principal_id: "mock-user",
    role: "viewer",
  },
  {
    collaboration_id: "g-12",
    folder_id: "370710000012",
    principal_type: "user",
    principal_id: "mock-user",
    role: "viewer",
  },
  {
    collaboration_id: "g-13",
    folder_id: "370710000013",
    principal_type: "user",
    principal_id: "mock-user",
    role: "viewer",
  },
  {
    collaboration_id: "g-9",
    folder_id: "370710000004",
    principal_type: "user",
    principal_id: "mock-user",
    role: "viewer",
  },
  {
    collaboration_id: "g-8",
    folder_id: "370710000002",
    principal_type: "user",
    principal_id: "ops-admin",
    role: "editor",
  },
];

/** ユーザー → 所属グループ。本番は既存の「ユーザーとグループの対応」を使う */
const userGroups: Record<string, string[]> = {
  u001: ["grp-dev"],
  "mock-user": ["grp-dev"],
  "dev-lead": ["grp-dev"],
  "ops-admin": ["grp-ops"],
};

/** Config.apiOption の既定ユーザーと同じ */
const DEFAULT_MOCK_USER = "mock-user";

const ROLE_STRENGTH: Record<SharedAreaRole, number> = { viewer: 1, editor: 2 };

/**
 * ユーザーに見せる、共有された領域の一覧（設計書「5. 一覧表示のロジック」）。
 * Box は呼ばず、DB だけで組み立てる。
 */
export const listSharedAreas = (inputUserCd: string): SharedAreaItem[] => {
  // 開発中はログインユーザーが設定されない（空）ことがあるため、既定のモックユーザーとして扱う
  const userCd = inputUserCd || DEFAULT_MOCK_USER;
  const groupIds = userGroups[userCd] ?? [];
  const belongingCenterFolderIds = new Set(SHARE_AREAS.map((a) => a.boxFolderId));

  // 自分、または自分が属するグループ宛ての付与
  const mine = shareGrants.filter(
    (g) =>
      (g.principal_type === "user" && g.principal_id === userCd) ||
      (g.principal_type === "group" && groupIds.includes(g.principal_id)),
  );

  // フォルダごとにまとめて、最も強いロールを採用する
  const roleByFolder = new Map<string, SharedAreaRole>();
  for (const grant of mine) {
    const current = roleByFolder.get(grant.folder_id);
    if (!current || ROLE_STRENGTH[grant.role] > ROLE_STRENGTH[current]) {
      roleByFolder.set(grant.folder_id, grant.role);
    }
  }

  const items: SharedAreaItem[] = [];
  for (const [folderId, role] of roleByFolder) {
    const folder = sharedFolders.find((f) => f.folder_id === folderId);
    // 所属・ゲストのセンターは、所属のカードに出るため除く
    if (!folder || belongingCenterFolderIds.has(folder.center_folder_id)) continue;
    items.push({
      folderId: folder.folder_id,
      centerFolderId: folder.center_folder_id,
      centerName: centerNames[folder.center_folder_id] ?? folder.center_folder_id,
      centerLabel:
        centerLabels[folder.center_folder_id] ??
        centerNames[folder.center_folder_id] ??
        folder.center_folder_id,
      folderName: folder.folder_name,
      pathNames: [...folder.path_names],
      role,
      status: folder.status,
    });
  }

  return items.sort(
    (a, b) =>
      a.centerName.localeCompare(b.centerName, "ja") ||
      a.folderName.localeCompare(b.folderName, "ja"),
  );
};
