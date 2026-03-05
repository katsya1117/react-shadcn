export type BoxElementOptions = {
  container: string | HTMLElement;
  locale?: string;
  canUpload?: boolean;
  canCreateNewFolder?: boolean;
  canDelete?: boolean;
  canRename?: boolean;
  canPreview?: boolean;
  canDownload?: boolean;
  isHeaderVisible?: boolean;
  isHeaderLogoVisible?: boolean;
  maxSelectable?: number;
  size?: string;
  hasMetadata?: boolean;
  hasActivityFeed?: boolean;
  hasVersions?: boolean;
  detailsSidebarProps?: {
    hasProperties?: boolean;
    hasAccessStats?: boolean;
    hasClassification?: boolean;
    hasRetentionPolicy?: boolean;
  };
};

export type BoxElementItem = {
  id?: string | number;
  type?: string;
};

export type BoxElementEvent = {
  items?: BoxElementItem[];
};

export type BoxElementInstance = {
  show: (id: string, token: string, options?: BoxElementOptions) => void;
  hide: () => void;
  addListener: (
    event: string,
    handler: (data: BoxElementEvent | BoxElementItem[]) => void,
  ) => void;
  removeListener?: (
    event: string,
    handler: (data: BoxElementEvent | BoxElementItem[]) => void,
  ) => void;
  removeAllListeners?: () => void;
};

export type BoxGlobal = {
  ContentExplorer: new () => BoxElementInstance;
  FilePicker: new () => BoxElementInstance;
  Preview: new () => BoxElementInstance;
  ContentSidebar: new () => BoxElementInstance;
};

declare global {
  interface Window {
    Box?: BoxGlobal;
  }
}
