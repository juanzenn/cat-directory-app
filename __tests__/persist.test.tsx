import { expect, test } from "vitest";
import {
  CATS_PERSIST_KEY,
  CATS_PERSIST_MAX_PAGES,
  getCatsPersistOptions,
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
  expect(CATS_PERSIST_KEY).toBe("cat-directory-cats-v2");

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
