/**
 * Box Content Explorer のフォルダ取得を、短時間キャッシュする（API 呼び出し回数の削減）。
 *
 * Content Explorer は、フォルダを開くたびに（訪問済みでも）次の通信を行う。
 *   GET https://api.box.com/2.0/folders/{id}?fields=…&sort=…&direction=…&limit=…&offset=…
 * Box UI Elements v23.0.0 は fetchFolder で forceFetch: true を固定で渡すため、設定では抑えられない。
 *
 * そこで、Explorer の show() に渡せる requestInterceptor / responseInterceptor（axios の中継処理）を使う。
 * - 応答: フォルダ取得の成功応答を保存する。
 * - 要求: 同じ要求の保存済み応答が有効時間内なら、axios の adapter を差し替えて、通信せずに保存済みの応答を返す。
 *
 * 注意:
 * - 保存するのはフォルダ取得（GET /folders/{id}）だけ。/items や /collaborations などは対象外。
 * - キーにアクセストークンを含める。ユーザーが変わる・トークンが更新されると、別のキーになる（他人の応答を返さない）。
 * - 他の人が Box 側で行った変更は、有効時間の間は反映されない。
 * - 仕様・設計の背景は docs/report-box-api-call-reduction.md を参照。
 */

/** フォルダ取得のキャッシュの有効時間（5 分）。コラボレーター一覧のキャッシュと揃えている。 */
export const BOX_FOLDER_CACHE_TTL_MS = 5 * 60 * 1000;
/** 保持する最大件数。超えたら古いものから捨てる。 */
export const BOX_FOLDER_CACHE_MAX_ENTRIES = 200;

type HeadersLike =
  | Record<string, unknown>
  | { get?: (name: string) => unknown }
  | undefined;

/** axios のリクエスト設定のうち、このキャッシュが使う部分 */
export type RequestConfigLike = {
  method?: string;
  url?: string;
  params?: Record<string, unknown>;
  headers?: HeadersLike;
  adapter?: unknown;
};

/** axios のレスポンスのうち、このキャッシュが使う部分 */
export type ResponseLike = {
  status?: number;
  statusText?: string;
  data?: unknown;
  config?: RequestConfigLike;
  /** キャッシュから返した応答の印。再保存（有効時間の延長）を防ぐ */
  fromBoxFolderCache?: boolean;
};

export type BoxFolderCacheEvent = {
  type: "hit" | "miss" | "store";
  /** 要求の識別（パスとパラメータ。トークンは含めない） */
  request: string;
  hits: number;
  misses: number;
};

type Entry = {
  savedAt: number;
  data: unknown;
  status: number;
  statusText: string;
};

const FOLDER_PATH_PATTERN = /\/folders\/[^/?#]+$/;

const getPath = (url: string | undefined): string => {
  if (!url) return "";
  const withoutQuery = url.split(/[?#]/)[0];
  return withoutQuery;
};

/** フォルダ取得（GET /folders/{id}）の要求か。/folders/{id}/items などは含まない */
export const isFolderRequest = (config: RequestConfigLike | undefined): boolean => {
  if (!config) return false;
  if ((config.method ?? "get").toLowerCase() !== "get") return false;
  return FOLDER_PATH_PATTERN.test(getPath(config.url));
};

const readHeader = (headers: HeadersLike, name: string): string => {
  if (!headers) return "";
  const getter = (headers as { get?: (n: string) => unknown }).get;
  const value =
    typeof getter === "function"
      ? getter.call(headers, name)
      : (headers as Record<string, unknown>)[name];
  return typeof value === "string" ? value : "";
};

const stableParams = (params: Record<string, unknown> | undefined): string => {
  if (!params) return "";
  return Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join("&");
};

/** ログ等に出してよい、要求の識別（トークンを含まない） */
const describeRequest = (config: RequestConfigLike): string =>
  `${getPath(config.url)}?${stableParams(config.params)}`;

/** キャッシュのキー。トークンを含める（ユーザー・トークンが変われば別のキーになる） */
export const buildCacheKey = (config: RequestConfigLike): string =>
  `${readHeader(config.headers, "Authorization")}\u0000${describeRequest(config)}`;

// 応答は JSON 由来の素のデータなので、JSON 経由で深いコピーを作る。
// Box のコードが応答を書き換えても、保存済みの内容を壊さないため。
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

type Options = {
  ttlMs?: number;
  maxEntries?: number;
  /** 現在時刻（ミリ秒）。テスト用に差し替えられる */
  now?: () => number;
  /** 命中・未命中・保存のたびに呼ばれる（開発時のログ・計測用） */
  onEvent?: (event: BoxFolderCacheEvent) => void;
};

export const createBoxFolderCache = ({
  ttlMs = BOX_FOLDER_CACHE_TTL_MS,
  maxEntries = BOX_FOLDER_CACHE_MAX_ENTRIES,
  now = Date.now,
  onEvent,
}: Options = {}) => {
  const store = new Map<string, Entry>();
  const stats = { hits: 0, misses: 0 };

  const emit = (type: BoxFolderCacheEvent["type"], config: RequestConfigLike) =>
    onEvent?.({
      type,
      request: describeRequest(config),
      hits: stats.hits,
      misses: stats.misses,
    });

  const purgeExpired = () => {
    const current = now();
    for (const [key, entry] of store) {
      if (current - entry.savedAt >= ttlMs) store.delete(key);
    }
  };

  /** 通信の直前。有効な保存済みの応答があれば、通信せずにそれを返すよう設定を書き換える */
  const requestInterceptor = <T extends RequestConfigLike>(config: T): T => {
    if (!isFolderRequest(config)) return config;

    const key = buildCacheKey(config);
    const entry = store.get(key);
    if (!entry || now() - entry.savedAt >= ttlMs) {
      if (entry) store.delete(key);
      stats.misses += 1;
      emit("miss", config);
      return config;
    }

    stats.hits += 1;
    emit("hit", config);
    config.adapter = (cfg: RequestConfigLike): Promise<ResponseLike> =>
      Promise.resolve({
        data: clone(entry.data),
        status: entry.status,
        statusText: entry.statusText,
        config: cfg,
        fromBoxFolderCache: true,
      });
    return config;
  };

  /**
   * 応答の後。フォルダ取得の成功応答を保存し、応答はそのまま返す。
   * Box は、通信エラーのときにもこの関数を（エラー内容を引数にして）呼ぶので、
   * どんな入力でも例外を投げず、そのまま返す。
   */
  const responseInterceptor = <T>(response: T): T => {
    try {
      const res = response as unknown as ResponseLike | undefined;
      if (!res || typeof res !== "object") return response;
      if (res.fromBoxFolderCache) return response;
      if (res.status !== 200 || !isFolderRequest(res.config)) return response;

      const config = res.config as RequestConfigLike;
      purgeExpired();
      const key = buildCacheKey(config);
      // 入れ直して、挿入順を新しくする（古いものから捨てるため）
      store.delete(key);
      store.set(key, {
        savedAt: now(),
        data: clone(res.data),
        status: res.status,
        statusText: res.statusText ?? "OK",
      });
      while (store.size > maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
      emit("store", config);
    } catch {
      // キャッシュの失敗で、通常の通信を妨げない
    }
    return response;
  };

  return {
    requestInterceptor,
    responseInterceptor,
    clear: () => store.clear(),
    size: () => store.size,
    getStats: () => ({ ...stats }),
  };
};

// ===== アプリ全体で共有するインスタンス =====
// 画面（SS）を離れてもキャッシュを残し、領域の行き来でも使えるよう、画面の外に置く。

let enabled = true;
let debug = false;

export const boxFolderCache = createBoxFolderCache({
  onEvent: (event) => {
    if (!debug) return;
    // console.debug は、Chrome の既定の設定では隠れる（「詳細」レベル）ため、info を使う。
    console.info(
      `[boxFolderCache] ${event.type} ${event.request} (命中 ${event.hits} / 未命中 ${event.misses})`,
    );
  },
});

/** 起動時（main.tsx）に、有効・無効と、開発時のログ出力を設定する */
export const configureBoxFolderCache = (options: {
  enabled?: boolean;
  debug?: boolean;
}) => {
  if (options.enabled !== undefined) enabled = options.enabled;
  if (options.debug !== undefined) debug = options.debug;
};

export const isBoxFolderCacheEnabled = () => enabled;
