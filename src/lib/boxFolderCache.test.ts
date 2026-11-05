import { jest } from "@jest/globals";
import axios from "axios";

import {
  BOX_FOLDER_CACHE_MAX_ENTRIES,
  BOX_FOLDER_CACHE_TTL_MS,
  boxFolderCache,
  buildCacheKey,
  configureBoxFolderCache,
  createBoxFolderCache,
  isBoxFolderCacheEnabled,
  isFolderRequest,
  type BoxFolderCacheEvent,
  type RequestConfigLike,
  type ResponseLike,
} from "./boxFolderCache";

const FOLDER_URL = "https://api.box.com/2.0/folders/123";
const AUTH = { Authorization: "Bearer token-A" };

const folderConfig = (overrides: Partial<RequestConfigLike> = {}): RequestConfigLike => ({
  method: "get",
  url: FOLDER_URL,
  params: { fields: "id,name", limit: 100, offset: 0, sort: "name" },
  headers: { ...AUTH },
  ...overrides,
});

const okResponse = (
  config: RequestConfigLike,
  data: unknown = { id: "123", item_collection: { entries: [{ id: "1" }] } },
): ResponseLike => ({ status: 200, statusText: "OK", data, config });

/**
 * 要求 → 応答 の順に、中継処理を通す（実際の axios と同じ順序）。
 * 命中したときの応答には印が付いていて保存されないので、ここでは応答側の処理を通さない
 * （印の扱いは、専用のテストで確認している）。
 */
const roundTrip = (
  cache: ReturnType<typeof createBoxFolderCache>,
  config: RequestConfigLike,
  data?: unknown,
) => {
  const requested = cache.requestInterceptor({ ...config });
  const hit = typeof requested.adapter === "function";
  if (!hit) cache.responseInterceptor(okResponse(requested, data));
  return { requested, hit };
};

describe("isFolderRequest", () => {
  it.each([
    ["https://api.box.com/2.0/folders/123", true],
    ["https://api.box.com/2.0/folders/0", true],
    ["https://api.box.com/2.0/folders/123?fields=id", true],
    ["https://api.box.com/2.0/folders/123/items", false],
    ["https://api.box.com/2.0/folders/123/collaborations", false],
    ["https://api.box.com/2.0/folders", false],
    ["https://api.box.com/2.0/files/123", false],
    ["", false],
  ])("%s → %s", (url, expected) => {
    expect(isFolderRequest(folderConfig({ url }))).toBe(expected);
  });

  it("GET 以外は対象外。method 省略時は GET として扱う", () => {
    expect(isFolderRequest(folderConfig({ method: "post" }))).toBe(false);
    expect(isFolderRequest(folderConfig({ method: "GET" }))).toBe(true);
    expect(isFolderRequest({ url: FOLDER_URL })).toBe(true);
  });

  it("設定がないときは対象外", () => {
    expect(isFolderRequest(undefined)).toBe(false);
  });
});

describe("buildCacheKey", () => {
  it("パラメータの順序が違っても同じキーになる", () => {
    const a = buildCacheKey(folderConfig({ params: { a: 1, b: 2 } }));
    const b = buildCacheKey(folderConfig({ params: { b: 2, a: 1 } }));
    expect(a).toBe(b);
  });

  it("パラメータ・URL・トークンのどれかが違えば別のキーになる", () => {
    const base = buildCacheKey(folderConfig());
    expect(buildCacheKey(folderConfig({ params: { sort: "date" } }))).not.toBe(base);
    expect(buildCacheKey(folderConfig({ url: "https://api.box.com/2.0/folders/456" }))).not.toBe(base);
    expect(buildCacheKey(folderConfig({ headers: { Authorization: "Bearer token-B" } }))).not.toBe(base);
  });

  it("axios の AxiosHeaders のような get() を持つヘッダーからも、トークンを読める", () => {
    const headers = { get: (name: string) => (name === "Authorization" ? "Bearer token-A" : undefined) };
    expect(buildCacheKey(folderConfig({ headers }))).toBe(buildCacheKey(folderConfig()));
  });
});

describe("createBoxFolderCache", () => {
  it("1 回目は通信し（未命中）、2 回目は通信せず保存済みの応答を返す（命中）", async () => {
    const cache = createBoxFolderCache();

    const first = roundTrip(cache, folderConfig());
    expect(first.hit).toBe(false);

    const second = roundTrip(cache, folderConfig());
    expect(second.hit).toBe(true);
    const adapter = second.requested.adapter as (c: RequestConfigLike) => Promise<ResponseLike>;
    const response = await adapter(second.requested);
    expect(response).toMatchObject({
      status: 200,
      fromBoxFolderCache: true,
      data: { id: "123", item_collection: { entries: [{ id: "1" }] } },
    });
    expect(cache.getStats()).toEqual({ hits: 1, misses: 1 });
  });

  it("キャッシュから返した応答を書き換えても、保存済みの内容は変わらない", async () => {
    const cache = createBoxFolderCache();
    roundTrip(cache, folderConfig());

    const hit1 = roundTrip(cache, folderConfig());
    const adapter1 = hit1.requested.adapter as (c: RequestConfigLike) => Promise<ResponseLike>;
    const r1 = await adapter1(hit1.requested);
    (r1.data as { id: string }).id = "MUTATED";

    const hit2 = roundTrip(cache, folderConfig());
    const adapter2 = hit2.requested.adapter as (c: RequestConfigLike) => Promise<ResponseLike>;
    const r2 = await adapter2(hit2.requested);
    expect((r2.data as { id: string }).id).toBe("123");
  });

  it("保存したあとに元の応答を書き換えても、保存済みの内容は変わらない", async () => {
    const cache = createBoxFolderCache();
    const original = { id: "123" };
    roundTrip(cache, folderConfig(), original);
    original.id = "MUTATED";

    const hit = roundTrip(cache, folderConfig());
    const adapter = hit.requested.adapter as (c: RequestConfigLike) => Promise<ResponseLike>;
    expect(((await adapter(hit.requested)).data as { id: string }).id).toBe("123");
  });

  it("有効時間を過ぎたら、通信し直す", () => {
    let current = 1_000_000;
    const cache = createBoxFolderCache({ now: () => current });
    roundTrip(cache, folderConfig());

    current += BOX_FOLDER_CACHE_TTL_MS - 1;
    expect(roundTrip(cache, folderConfig()).hit).toBe(true);

    // 命中しても有効時間は延びない（保存時刻は変わらない）
    current += 1;
    expect(roundTrip(cache, folderConfig()).hit).toBe(false);
  });

  it("キャッシュから返した応答は再保存されない（有効時間が延びない）", async () => {
    let current = 0;
    const cache = createBoxFolderCache({ now: () => current });
    roundTrip(cache, folderConfig()); // t=0 に保存

    current = BOX_FOLDER_CACHE_TTL_MS - 1000;
    const hit = cache.requestInterceptor(folderConfig());
    const adapter = hit.adapter as (c: RequestConfigLike) => Promise<ResponseLike>;
    const cached = await adapter(hit);
    cache.responseInterceptor(cached); // 応答の中継処理を通しても、再保存されない

    current = BOX_FOLDER_CACHE_TTL_MS; // 最初の保存から 5 分
    expect(cache.requestInterceptor(folderConfig()).adapter).toBeUndefined();
  });

  it("パラメータ（並び替え等）やトークンが違えば命中しない", () => {
    const cache = createBoxFolderCache();
    roundTrip(cache, folderConfig());

    expect(roundTrip(cache, folderConfig({ params: { sort: "date" } })).hit).toBe(false);
    expect(
      roundTrip(cache, folderConfig({ headers: { Authorization: "Bearer token-B" } })).hit,
    ).toBe(false);
  });

  it("フォルダ取得以外の要求は、保存も命中もしない", () => {
    const cache = createBoxFolderCache();
    const items = folderConfig({ url: `${FOLDER_URL}/items` });

    expect(roundTrip(cache, items).hit).toBe(false);
    expect(roundTrip(cache, items).hit).toBe(false);
    expect(cache.size()).toBe(0);
    expect(cache.getStats()).toEqual({ hits: 0, misses: 0 });
  });

  it("成功（200）以外の応答は保存しない", () => {
    const cache = createBoxFolderCache();
    const config = folderConfig();
    cache.responseInterceptor({ ...okResponse(config), status: 404 });
    cache.responseInterceptor({ ...okResponse(config), status: 500 });

    expect(cache.size()).toBe(0);
  });

  it("responseInterceptor は、エラー内容など想定外の入力でも例外を投げず、そのまま返す", () => {
    const cache = createBoxFolderCache();
    // Box は通信エラー時に、エラー内容（config を持たないオブジェクト）を引数に呼ぶ
    const errorLike = { message: "Network Error", code: "ERR_NETWORK" };

    expect(cache.responseInterceptor(errorLike)).toBe(errorLike);
    expect(cache.responseInterceptor(undefined)).toBeUndefined();
    expect(cache.responseInterceptor(null)).toBeNull();
    expect(cache.responseInterceptor("text")).toBe("text");
    expect(cache.size()).toBe(0);
  });

  it("応答の保存に失敗しても、応答はそのまま返す", () => {
    const cache = createBoxFolderCache();
    const circular: Record<string, unknown> = {};
    circular.self = circular; // JSON に変換できない
    const response = okResponse(folderConfig(), circular);

    expect(cache.responseInterceptor(response)).toBe(response);
    expect(cache.size()).toBe(0);
  });

  it("最大件数を超えたら、古いものから捨てる", () => {
    const cache = createBoxFolderCache({ maxEntries: 2 });
    const url = (id: string) => `https://api.box.com/2.0/folders/${id}`;
    roundTrip(cache, folderConfig({ url: url("1") }));
    roundTrip(cache, folderConfig({ url: url("2") }));
    roundTrip(cache, folderConfig({ url: url("3") }));

    expect(cache.size()).toBe(2);
    expect(cache.requestInterceptor(folderConfig({ url: url("1") })).adapter).toBeUndefined();
    expect(typeof cache.requestInterceptor(folderConfig({ url: url("3") })).adapter).toBe("function");
  });

  it("期限切れのものは、保存のときに掃除される", () => {
    let current = 0;
    const cache = createBoxFolderCache({ now: () => current });
    roundTrip(cache, folderConfig({ url: "https://api.box.com/2.0/folders/1" }));
    current = BOX_FOLDER_CACHE_TTL_MS + 1;

    roundTrip(cache, folderConfig({ url: "https://api.box.com/2.0/folders/2" }));

    expect(cache.size()).toBe(1);
  });

  it("clear() で全て破棄する", () => {
    const cache = createBoxFolderCache();
    roundTrip(cache, folderConfig());

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(roundTrip(cache, folderConfig()).hit).toBe(false);
  });

  it("onEvent に、未命中・保存・命中が、トークンを含まない形で通知される", () => {
    const events: BoxFolderCacheEvent[] = [];
    const cache = createBoxFolderCache({ onEvent: (e) => events.push(e) });

    roundTrip(cache, folderConfig());
    roundTrip(cache, folderConfig());

    expect(events.map((e) => e.type)).toEqual(["miss", "store", "hit"]);
    expect(events.at(-1)).toMatchObject({ hits: 1, misses: 1 });
    expect(JSON.stringify(events)).not.toContain("token-A");
  });

  it("既定の最大件数は 200", () => {
    expect(BOX_FOLDER_CACHE_MAX_ENTRIES).toBe(200);
  });
});

// ===== 実際の axios での結合テスト =====
// Box の画面部品が使う仕組み（axios のインスタンスに、中継処理を登録する）と同じ形で、
// 2 回目の要求が通信（adapter）まで届かないことを確認する。
describe("axios との結合", () => {
  const makeClient = () => {
    const cache = createBoxFolderCache();
    let networkCalls = 0;
    const client = axios.create({
      adapter: async (config) => {
        networkCalls += 1;
        return {
          data: { id: "123", call: networkCalls },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });
    client.interceptors.request.use(cache.requestInterceptor as never);
    client.interceptors.response.use(cache.responseInterceptor as never);
    return { client, cache, calls: () => networkCalls };
  };

  const get = (client: ReturnType<typeof makeClient>["client"], params?: Record<string, unknown>) =>
    client.get(FOLDER_URL, { params: params ?? { fields: "id", limit: 100 }, headers: AUTH });

  it("同じフォルダの 2 回目は通信せず、1 回目と同じ内容が返る", async () => {
    const { client, calls } = makeClient();

    const first = await get(client);
    const second = await get(client);

    expect(calls()).toBe(1);
    expect(first.data).toEqual({ id: "123", call: 1 });
    expect(second.data).toEqual({ id: "123", call: 1 });
    expect(second.status).toBe(200);
  });

  it("パラメータが違えば、通信する", async () => {
    const { client, calls } = makeClient();

    await get(client, { sort: "name" });
    await get(client, { sort: "date" });

    expect(calls()).toBe(2);
  });

  it("フォルダ取得以外（/items）は、毎回通信する", async () => {
    const { client, calls } = makeClient();

    await client.get(`${FOLDER_URL}/items`, { headers: AUTH });
    await client.get(`${FOLDER_URL}/items`, { headers: AUTH });

    expect(calls()).toBe(2);
  });

  it("clear() の後は、通信する", async () => {
    const { client, cache, calls } = makeClient();
    await get(client);

    cache.clear();
    await get(client);

    expect(calls()).toBe(2);
  });
});

// ===== アプリ全体で共有するインスタンスと設定 =====
describe("共有インスタンスと設定", () => {
  afterEach(() => {
    configureBoxFolderCache({ enabled: true, debug: false });
    boxFolderCache.clear();
    jest.restoreAllMocks();
  });

  it("既定では有効", () => {
    expect(isBoxFolderCacheEnabled()).toBe(true);
  });

  it("configureBoxFolderCache で有効・無効を切り替えられる", () => {
    configureBoxFolderCache({ enabled: false });
    expect(isBoxFolderCacheEnabled()).toBe(false);

    configureBoxFolderCache({ enabled: true });
    expect(isBoxFolderCacheEnabled()).toBe(true);
  });

  it("debug が有効なときだけ、命中・未命中をコンソールに出す", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});

    boxFolderCache.requestInterceptor(folderConfig());
    expect(spy).not.toHaveBeenCalled();

    configureBoxFolderCache({ debug: true });
    boxFolderCache.requestInterceptor(folderConfig());
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("[boxFolderCache] miss"));
    expect(JSON.stringify(spy.mock.calls)).not.toContain("token-A");
  });
});
