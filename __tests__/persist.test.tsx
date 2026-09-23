import { expect, test } from "vitest";
import {
  CATS_PERSIST_KEY,
  CATS_PERSIST_MAX_PAGES,
  deserializePersistedClient,
  getCatsPersistOptions,
  parsePersistedCatsInfinite,
  trimInfiniteDataToPersistedPages,
} from "@/lib/query/persist";
import { catsInfiniteQueryOptions } from "@/lib/queries/cats";

test("trimInfiniteDataToPersistedPages keeps only the first 3 pages", () => {
  const trimmed = trimInfiniteDataToPersistedPages({
    pages: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    pageParams: [1, 2, 3, 4, 5],
  });

  expect(CATS_PERSIST_MAX_PAGES).toBe(3);
  expect(trimmed).toEqual({
    pages: [{ id: 1 }, { id: 2 }, { id: 3 }],
    pageParams: [1, 2, 3],
  });
});

test("trimInfiniteDataToPersistedPages leaves short data unchanged", () => {
  const data = {
    pages: [{ id: 1 }, { id: 2 }],
    pageParams: [1, 2],
  };
  expect(trimInfiniteDataToPersistedPages(data)).toBe(data);
});

test("getCatsPersistOptions only dehydrates successful cats queries", () => {
  const { dehydrateOptions, maxAge, persister } = getCatsPersistOptions();

  expect(persister).toBeDefined();
  expect(maxAge).toBe(1000 * 60 * 60 * 24);
  expect(CATS_PERSIST_KEY).toBe("cat-directory-cats-v3");

  const shouldDehydrate = dehydrateOptions?.shouldDehydrateQuery;
  expect(shouldDehydrate).toBeTypeOf("function");

  expect(
    shouldDehydrate!({
      queryKey: catsInfiniteQueryOptions.queryKey,
      state: { status: "success" },
    } as never),
  ).toBe(true);

  expect(
    shouldDehydrate!({
      queryKey: catsInfiniteQueryOptions.queryKey,
      state: { status: "pending" },
    } as never),
  ).toBe(false);

  expect(
    shouldDehydrate!({
      queryKey: ["other"],
      state: { status: "success" },
    } as never),
  ).toBe(false);

  expect(
    dehydrateOptions?.serializeData?.({
      pages: [1, 2, 3, 4],
      pageParams: [1, 2, 3, 4],
    }),
  ).toEqual({
    pages: [1, 2, 3],
    pageParams: [1, 2, 3],
  });
});

const validPage = {
  current_page: 1,
  data: [
    {
      breed: "Abyssinian",
      country: "Ethiopia",
      origin: "Natural/Standard",
      coat: "Short",
      pattern: "Ticked",
    },
  ],
  per_page: 12,
  total: 1,
  last_page: 1,
  next_page_url: null,
  prev_page_url: null,
};

test("parsePersistedCatsInfinite accepts valid infinite data", () => {
  const data = {
    pages: [validPage],
    pageParams: [1],
  };
  expect(parsePersistedCatsInfinite(data)).toEqual(data);
});

test("parsePersistedCatsInfinite rejects corrupt pages", () => {
  expect(
    parsePersistedCatsInfinite({
      pages: [{ id: 1 }],
      pageParams: [1],
    }),
  ).toBeUndefined();
});

test("deserializePersistedClient returns empty client for invalid JSON", () => {
  const restored = deserializePersistedClient("{not-json");
  expect(restored).toEqual({
    timestamp: 0,
    buster: "",
    clientState: { mutations: [], queries: [] },
  });
});

test("deserializePersistedClient drops invalid cats queries", () => {
  const cached = JSON.stringify({
    timestamp: Date.now(),
    buster: "",
    clientState: {
      mutations: [],
      queries: [
        {
          queryKey: catsInfiniteQueryOptions.queryKey,
          queryHash: '["cats"]',
          state: {
            data: { pages: [{ id: 1 }], pageParams: [1] },
            dataUpdateCount: 1,
            dataUpdatedAt: Date.now(),
            error: null,
            errorUpdateCount: 0,
            errorUpdatedAt: 0,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            fetchMeta: null,
            isInvalidated: false,
            status: "success",
            fetchStatus: "idle",
          },
        },
      ],
    },
  });

  const restored = deserializePersistedClient(cached);
  expect(restored.clientState.queries).toHaveLength(0);
});

test("deserializePersistedClient keeps valid cats queries", () => {
  const data = { pages: [validPage], pageParams: [1] };
  const cached = JSON.stringify({
    timestamp: Date.now(),
    buster: "",
    clientState: {
      mutations: [],
      queries: [
        {
          queryKey: catsInfiniteQueryOptions.queryKey,
          queryHash: '["cats"]',
          state: {
            data,
            dataUpdateCount: 1,
            dataUpdatedAt: Date.now(),
            error: null,
            errorUpdateCount: 0,
            errorUpdatedAt: 0,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            fetchMeta: null,
            isInvalidated: false,
            status: "success",
            fetchStatus: "idle",
          },
        },
      ],
    },
  });

  const restored = deserializePersistedClient(cached);
  expect(restored.clientState.queries).toHaveLength(1);
  expect(restored.clientState.queries[0]?.state.data).toEqual(data);
});
