import {
  defaultShouldDehydrateQuery,
  type InfiniteData,
  type OmitKeyof,
} from "@tanstack/react-query";
import type { PersistQueryClientOptions } from "@tanstack/query-persist-client-core";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { catsInfiniteQueryOptions } from "@/lib/queries/cats";

export const CATS_PERSIST_KEY = "cat-directory-cats-v2";
export const CATS_PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24;
export const CATS_PERSIST_MAX_PAGES = 3;

/** Keep only the first N infinite pages when writing to storage. */
export function trimInfiniteDataToPersistedPages(
  data: unknown,
  maxPages = CATS_PERSIST_MAX_PAGES,
): unknown {
  if (
    !data ||
    typeof data !== "object" ||
    !("pages" in data) ||
    !("pageParams" in data)
  ) {
    return data;
  }

  const infinite = data as InfiniteData<unknown>;
  if (!Array.isArray(infinite.pages) || infinite.pages.length <= maxPages) {
    return data;
  }

  return {
    pages: infinite.pages.slice(0, maxPages),
    pageParams: infinite.pageParams.slice(0, maxPages),
  };
}

export function getCatsPersistOptions(): OmitKeyof<
  PersistQueryClientOptions,
  "queryClient"
> {
  return {
    persister: createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: CATS_PERSIST_KEY,
    }),
    maxAge: CATS_PERSIST_MAX_AGE_MS,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) &&
        query.queryKey[0] === catsInfiniteQueryOptions.queryKey[0],
      serializeData: (data) =>
        trimInfiniteDataToPersistedPages(data, CATS_PERSIST_MAX_PAGES),
    },
  };
}
