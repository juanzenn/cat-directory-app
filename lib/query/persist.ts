import {
  defaultShouldDehydrateQuery,
  type InfiniteData,
  type OmitKeyof,
} from "@tanstack/react-query";
import type {
  PersistedClient,
  PersistQueryClientOptions,
} from "@tanstack/query-persist-client-core";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistedCatsInfiniteSchema } from "@/lib/api";
import { catsInfiniteQueryOptions } from "@/lib/queries/cats";

export const CATS_PERSIST_KEY = "cat-directory-cats-v3";
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

/** Drop corrupt or stale shapes so hydrate cannot poison the UI. */
export function parsePersistedCatsInfinite(data: unknown) {
  const result = PersistedCatsInfiniteSchema.safeParse(data);
  return result.success ? result.data : undefined;
}

function isCatsQueryKey(queryKey: unknown): boolean {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === catsInfiniteQueryOptions.queryKey[0]
  );
}

const EMPTY_PERSISTED_CLIENT: PersistedClient = {
  timestamp: 0,
  buster: "",
  clientState: { mutations: [], queries: [] },
};

export function deserializePersistedClient(cached: string): PersistedClient {
  let persisted: PersistedClient;
  try {
    persisted = JSON.parse(cached) as PersistedClient;
  } catch {
    return EMPTY_PERSISTED_CLIENT;
  }

  const queries = persisted.clientState?.queries;

  if (!Array.isArray(queries)) {
    return persisted;
  }

  persisted.clientState.queries = queries.filter((query) => {
    if (!isCatsQueryKey(query.queryKey)) {
      return true;
    }

    const data = query.state?.data;
    if (data == null) {
      return true;
    }

    const validated = parsePersistedCatsInfinite(data);
    if (validated === undefined) {
      return false;
    }

    query.state.data = validated;
    return true;
  });

  return persisted;
}

export function getCatsPersistOptions(): OmitKeyof<
  PersistQueryClientOptions,
  "queryClient"
> {
  return {
    persister: createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: CATS_PERSIST_KEY,
      deserialize: deserializePersistedClient,
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
