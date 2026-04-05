import type { FolderInfo } from "@/components/ss/types";

import { ssActions, ssSelector, ssSliceReducer } from "./ssSlice";

describe("ssSlice", () => {
  it("rootFolderId ごとに currentFolder と履歴状態を保持できる", () => {
    const folder: FolderInfo = {
      id: "child-folder",
      name: "child",
      pathCollection: {
        entries: [
          { id: "root-folder", name: "root" },
          { id: "parent-folder", name: "parent" },
        ],
      },
    };

    const next = ssSliceReducer(
      ssSliceReducer(
        undefined,
        ssActions.setCurrentFolder({ rootFolderId: "root-folder", folder }),
      ),
      ssActions.setFolderHistory({
        rootFolderId: "root-folder",
        history: ["root-folder", "parent-folder", "child-folder"],
        index: 2,
      }),
    );

    expect(next.currentFolderByRootId["root-folder"]).toEqual(folder);
    expect(next.folderHistoryByRootId["root-folder"]).toEqual([
      "root-folder",
      "parent-folder",
      "child-folder",
    ]);
    expect(next.historyIndexByRootId["root-folder"]).toBe(2);
  });

  it("selectors で root ごとの復元 state を取得できる", () => {
    const folder: FolderInfo = {
      id: "root-folder",
      name: "root",
      pathCollection: { entries: [] },
    };
    const sliceState = ssSliceReducer(
      ssSliceReducer(
        undefined,
        ssActions.setCurrentFolder({ rootFolderId: "root-folder", folder }),
      ),
      ssActions.setFolderHistory({
        rootFolderId: "root-folder",
        history: ["root-folder"],
        index: 0,
      }),
    );
    const rootState = { ss: sliceState } as Parameters<
      ReturnType<typeof ssSelector.currentFolderSelector>
    >[0];

    expect(ssSelector.currentFolderSelector("root-folder")(rootState)).toEqual(
      folder,
    );
    expect(ssSelector.folderHistorySelector("root-folder")(rootState)).toEqual([
      "root-folder",
    ]);
    expect(ssSelector.historyIndexSelector("root-folder")(rootState)).toBe(0);
  });
});
