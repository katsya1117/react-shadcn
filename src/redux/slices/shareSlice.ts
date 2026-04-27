import type { AppRootState } from "@/redux/store";
import { SHARE_AREAS } from "@/config/shareAreaConfig";

export type ShareAreaItem = {
  box_folder_id: string;
  group_name: string;
};

const mockAreas: ShareAreaItem[] = SHARE_AREAS.map((area) => ({
  box_folder_id: area.boxFolderId,
  group_name: area.folderName,
}));

export const shareSelector = {
  areaSelector: () => (_state: AppRootState): ShareAreaItem[] => mockAreas,
};
