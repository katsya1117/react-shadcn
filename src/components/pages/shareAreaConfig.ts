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
