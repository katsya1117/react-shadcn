export type * from "@box/types";

/** Box Content Explorer の navigate イベントが実際に送出するペイロード（snake_case）。
 *  @box/types の Folder とは命名が異なるため、独自定義で上書きする。 */
export type BoxFolder = {
  id: string;
  type: string;
  name?: string;
  path_collection?: {
    entries: Array<{ id: string; name?: string }>;
  };
};
