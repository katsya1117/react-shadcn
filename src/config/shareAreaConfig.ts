export type ShareArea = {
  code: string;
  folderName: string;
  label: string;
  isGuest?: boolean;
  jclUrl: string;
  boxFolderId: string;
};

export const SHARE_AREAS: ShareArea[] = [
  {
    code: "qms",
    folderName: "qms",
    label: "QMS事務局",
    jclUrl: "/launch/qms/jcl",
    boxFolderId: "370613768434",
  },
  {
    code: "ems",
    folderName: "ems",
    label: "EMS事務局",
    jclUrl: "/launch/ems/jcl",
    boxFolderId: "370615717715",
  },
  {
    code: "tg-room",
    folderName: "tg-room",
    label: "統合サーバー",
    isGuest: true,
    jclUrl: "/launch/tg-room/jcl",
    boxFolderId: "370616229381",
  },
  {
    code: "jclgd1swdv",
    folderName: "JCLGD1SWDV",
    label: "第1ソフトウェア開発センター",
    jclUrl: "/launch/JCLGD1SWDV/jcl",
    boxFolderId: "370615941389",
  },
];

const MOCK_CENTER_LABELS = [
  "第2ソフトウェア開発センター",
  "第3ソフトウェア開発センター",
  "品質保証センター",
  "インフラ基盤センター",
  "ネットワーク技術センター",
  "セキュリティ運用センター",
  "データ活用推進センター",
  "クラウドサービスセンター",
  "業務システム開発センター",
  "組込みシステム開発センター",
  "生産技術センター",
  "顧客サポートセンター",
  "研究開発センター",
  "人材育成センター",
  "購買管理センター",
  "経営企画室",
];

/**
 * ランチャーの My Center に出す、所属・ゲストのセンターのモック（20 件）。
 * 本番は API が DB の所属に応じて返す。
 * 先頭 4 件は実在のフォルダ（SHARE_AREAS）。残りは件数が多いときの見え方のためのもので、
 * Box のフォルダ ID は SHARE_AREAS の 1 件を流用している。
 */
export const MOCK_MY_CENTER_AREAS: ShareArea[] = [
  ...SHARE_AREAS,
  ...MOCK_CENTER_LABELS.map((label, index) => {
    const folderName = `JCLGD${index + 2}MOCK`;
    return {
      code: folderName.toLowerCase(),
      folderName,
      label,
      isGuest: index % 7 === 3,
      jclUrl: `/launch/${folderName}/jcl`,
      boxFolderId: "370615941389",
    };
  }),
];
