"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCatSearch } from "@/lib/hooks/use-cat-search";
import { useCatsRefresh } from "@/lib/hooks/use-cats-refresh";
import { useInfiniteVirtualFetch } from "@/lib/hooks/use-infinite-virtual-fetch";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";
import { useScrollPaddingEnd } from "@/lib/hooks/use-scroll-padding-end";
import { useScrollRestore } from "@/lib/hooks/use-scroll-restore";
import { useSyncPageFromScroll } from "@/lib/hooks/use-sync-page-from-scroll";
import {
  breedToSlug,
  CATS_MAX_SEARCH_LENGTH,
  catsIndexFromPage,
  filterCats,
} from "@/lib/queries/cats";
import { useCatsInfiniteQuery } from "@/lib/queries/use-cats-infinite-query";
import { buildCatsSearchString } from "@/lib/url/sync-url-params";
import type { Breed } from "@/lib/api";

function CatRowLink({
  cat,
  page,
  q,
}: {
  cat: Breed;
  page: number;
  q: string;
}) {
  return (
    <p className="truncate">
      <Link
        href={`/breeds/${breedToSlug(cat.breed)}${buildCatsSearchString({ page, q })}`}
        className="font-bold underline-offset-2 hover:underline focus-visible:underline"
      >
        {cat.breed}
      </Link>
      {" — "}
      {cat.country}
    </p>
  );
}

const ROW_HEIGHT = 44;
const PULL_THRESHOLD_PX = 72;

export default function CatList({
  initialPage = 1,
  initialQuery = "",
}: {
  initialPage?: number;
  initialQuery?: string;
}) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    status,
  } = useCatsInfiniteQuery();

  const parentRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedPage = useRef<number | null>(initialPage);
  const pendingRestoreIndex = useRef<number | null>(
    initialPage > 1 ? catsIndexFromPage(initialPage) : null,
  );
  const prefersReducedMotion = usePrefersReducedMotion();

  const { inputValue, setInputValue, debouncedQuery } = useCatSearch({
    initialQuery,
    parentRef,
    lastSyncedPage,
    pendingRestoreIndex,
  });

  const { refresh, isRefreshing } = useCatsRefresh({
    parentRef,
    lastSyncedPage,
    pendingRestoreIndex,
  });

  const cats = data?.pages.flatMap((page) => page.data) ?? [];
  const filteredCats = filterCats(cats, debouncedQuery);
  const isEmptyFilter =
    status === "success" &&
    filteredCats.length === 0 &&
    debouncedQuery.trim().length > 0;

  const { pullDistance, isPulling } = usePullToRefresh({
    scrollRef: parentRef,
    onRefresh: refresh,
    threshold: PULL_THRESHOLD_PX,
    disabled: isRefreshing || status !== "success",
  });

  const paddingEnd = useScrollPaddingEnd(parentRef, status);

  const rowVirtualizer = useVirtualizer({
    count: isEmptyFilter ? 0 : filteredCats.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    useFlushSync: false,
    paddingEnd,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  // First paint (SSR/hydrate) can have cats but no measured scroll el yet.
  // Keep rows on screen without faking a viewport that triggers fetchNextPage.
  const showVirtualFallback =
    status === "success" &&
    filteredCats.length > 0 &&
    virtualItems.length === 0;
  const showPullIndicator = isPulling || isRefreshing;
  const pullIndicatorHeight = prefersReducedMotion
    ? showPullIndicator
      ? PULL_THRESHOLD_PX
      : 0
    : isRefreshing
      ? PULL_THRESHOLD_PX
      : pullDistance;

  useScrollRestore({
    parentRef,
    pendingRestoreIndex,
    status,
    paddingEnd,
    filteredCount: filteredCats.length,
    hasNextPage: Boolean(hasNextPage),
    rowHeight: ROW_HEIGHT,
  });

  useInfiniteVirtualFetch({
    parentRef,
    virtualItems,
    filteredCount: filteredCats.length,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  useSyncPageFromScroll({
    parentRef,
    lastSyncedPage,
    pendingRestoreIndex,
    status,
    filteredCount: filteredCats.length,
    rowHeight: ROW_HEIGHT,
    virtualItems,
  });

  useEffect(() => {
    const main = document.getElementById("main-content");
    main?.focus({ preventScroll: true });
  }, []);

  if (status === "pending" && !isRefreshing) {
    return (
      <p role="status" aria-live="polite">
        Loading...
      </p>
    );
  }

  if (status === "error" && !data && !isRefreshing) {
    return (
      <p role="alert">
        Error: {error.message}
      </p>
    );
  }

  const linkPage = lastSyncedPage.current ?? initialPage;
  const linkQuery = debouncedQuery;
  const resultsLabel = debouncedQuery.trim()
    ? filteredCats.length === 0
      ? `No breeds match “${debouncedQuery.trim()}”`
      : `Showing ${filteredCats.length} of ${cats.length} breeds`
    : `${filteredCats.length} breeds`;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Search</span>
          <input
            type="search"
            value={inputValue}
            maxLength={CATS_MAX_SEARCH_LENGTH}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Filter by breed or country"
            className="rounded border border-neutral-300 bg-transparent px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={isRefreshing}
          className="inline-flex shrink-0 rounded border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {resultsLabel}
      </p>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {showPullIndicator ? (
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-end justify-center overflow-hidden text-sm text-muted"
            style={{ height: `${pullIndicatorHeight}px` }}
          >
            <p className="pb-2">
              {isRefreshing
                ? "Refreshing…"
                : pullDistance >= PULL_THRESHOLD_PX
                  ? "Release to refresh"
                  : "Pull to refresh"}
            </p>
          </div>
        ) : null}
        <div
          ref={parentRef}
          role="region"
          aria-label="Breed list"
          aria-busy={isRefreshing}
          className="h-full min-h-0 overflow-auto"
        >
          {isEmptyFilter ? (
            <p role="status" className="py-2 text-sm text-muted">
              No breeds match “{debouncedQuery.trim()}”.
            </p>
          ) : (
            <div
              role="list"
              className="relative w-full"
              style={{
                height: showVirtualFallback
                  ? `${(filteredCats.length + 1) * ROW_HEIGHT}px`
                  : `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {showVirtualFallback
                ? filteredCats.map((cat, index) => (
                    <div
                      key={`fallback-${cat.breed}-${index}`}
                      role="listitem"
                      data-index={index}
                      className="absolute left-0 top-0 flex w-full items-center"
                      style={{
                        height: `${ROW_HEIGHT}px`,
                        transform: `translateY(${index * ROW_HEIGHT}px)`,
                      }}
                    >
                      <CatRowLink cat={cat} page={linkPage} q={linkQuery} />
                    </div>
                  ))
                : virtualItems.map((virtualRow) => {
                    const isLoaderRow =
                      virtualRow.index > filteredCats.length - 1;
                    const cat = filteredCats[virtualRow.index];

                    return (
                      <div
                        key={virtualRow.key}
                        role={isLoaderRow ? undefined : "listitem"}
                        data-index={virtualRow.index}
                        className="absolute left-0 top-0 flex w-full items-center"
                        style={{
                          height: `${ROW_HEIGHT}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {isLoaderRow ? (
                          isFetchNextPageError ? (
                            <p role="alert" className="flex items-center gap-2">
                              <span>Error loading more cats.</span>
                              <button
                                type="button"
                                onClick={() => void fetchNextPage()}
                                className="rounded border border-neutral-300 px-2 py-1 text-sm font-medium"
                              >
                                Retry
                              </button>
                            </p>
                          ) : hasNextPage ? (
                            <p role="status" aria-live="polite">
                              Loading more...
                            </p>
                          ) : (
                            <p role="status">Nothing more to load.</p>
                          )
                        ) : cat ? (
                          <CatRowLink cat={cat} page={linkPage} q={linkQuery} />
                        ) : null}
                      </div>
                    );
                  })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
