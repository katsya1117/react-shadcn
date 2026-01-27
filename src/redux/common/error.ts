/**
 * slice の共通エラー定義
 */
export interface SliceError {
  isError: boolean;
  messages: string;
  details?: string;
}

export const initialSliceError: SliceError = {
  isError: false,
  messages: "",
  details: "",
};

export function setSliceError(
  message: string,
  details?: string
): SliceError {
  return {
    isError: true,
    messages: message,
    details: details,
  };
}

export const rejectedMessage =
  "予期せぬエラーが発生しました。";