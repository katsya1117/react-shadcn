import { isAxiosError } from "axios";

// --- APIエラーレスポンスの型 ---

/** バリデーションエラー: { name: "validation error", messages: Record<string, string> } */
interface ValidationErrorResponse {
  name: "validation error";
  messages: Record<string, string>;
}

/** その他APIエラー: { title: string, errors: { message: string }[] } */
interface TitleErrorResponse {
  title: string;
  errors: { message: string }[];
}

function isValidationError(data: unknown): data is ValidationErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as ValidationErrorResponse).name === "validation error" &&
    typeof (data as ValidationErrorResponse).messages === "object"
  );
}

function isTitleError(data: unknown): data is TitleErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as TitleErrorResponse).title === "string"
  );
}

/**
 * axios エラーから表示用メッセージを取り出す。
 * - ValidationError: messages の値を改行区切りで結合
 * - TitleError: title + errors[].message を改行区切りで結合
 * - それ以外: fallback を返す
 */
export function parseApiError(
  error: unknown,
  fallback = "予期せぬエラーが発生しました。",
): string {
  if (!isAxiosError(error)) return fallback;

  const data: unknown = error.response?.data;

  if (isValidationError(data)) {
    const lines = Object.values(data.messages).filter(Boolean);
    return lines.length > 0 ? lines.join("\n") : fallback;
  }

  if (isTitleError(data)) {
    const lines = [
      data.title,
      ...data.errors.map((e) => e.message).filter(Boolean),
    ].filter(Boolean);
    return lines.length > 0 ? lines.join("\n") : fallback;
  }

  return fallback;
}

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