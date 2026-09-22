"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";
import {
  catsIndexFromPage,
  catsInfiniteQueryOptions,
  catsPageFromScrollTop,
  filterCats,
} from "@/lib/queries/cats";
import { useCatsInfiniteQuery } from "@/lib/queries/use-cats-infinite-query";

const ROW_HEIGHT = 44;
const SEARCH_DEBOUNCE_MS = 300;
const PULL_THRESHOLD_PX = 72;

function syncUrlParams({ page, q }: { page?: number; q?: string }) {
  const url = new URL(window.location.href);

  if (page !== undefined) {
    if (page <= 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", String(page));
    }
  }

  if (q !== undefined) {
    if (!q) {
      url.searchParams.delete("q");
    } else {
      url.searchParams.set("q", q);
    }
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}

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

  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedPage = useRef<number | null>(initialPage);
  const pendingRestoreIndex = useRef<number | null>(
    initialPage > 1 ? catsIndexFromPage(initialPage) : null,
  );
  const [paddingEnd, setPaddingEnd] = useState(0);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const debouncedQuery = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);
  const isFirstDebouncedQuery = useRef(true);
  const isRefreshingRef = useRef(false);

  const cats = data?.pages.flatMap((page) => page.data) ?? [];
  const filteredCats = filterCats(cats, debouncedQuery);

  const refresh = async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    pendingRestoreIndex.current = null;
    lastSyncedPage.current = 1;

    const el = parentRef.current;
    if (el) {
      el.scrollTop = 0;
    }

    syncUrlParams({ page: 1 });

    try {
      await queryClient.resetQueries({
        queryKey: catsInfiniteQueryOptions.queryKey,
      });
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  };

  const { pullDistance, isPulling } = usePullToRefresh({
    scrollRef: parentRef,
    onRefresh: refresh,
    threshold: PULL_THRESHOLD_PX,
    disabled: isRefreshing || status !== "success",
  });

  const rowVirtualizer = useVirtualizer({
    count: filteredCats.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    useFlushSync: false,
    paddingEnd,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const showPullIndicator = isPulling || isRefreshing;
  const pullIndicatorHeight = isRefreshing
    ? PULL_THRESHOLD_PX
    : pullDistance;

  useEffect(() => {
    if (isFirstDebouncedQuery.current) {
      isFirstDebouncedQuery.current = false;
      return;
    }

    lastSyncedPage.current = 1;
    pendingRestoreIndex.current = null;

    const el = parentRef.current;
    if (el) {
      el.scrollTop = 0;
    }

    syncUrlParams({ page: 1, q: debouncedQuery.trim() });
  }, [debouncedQuery]);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const el = parentRef.current;
    if (!el) {
      return;
    }

    const updatePadding = () => {
      setPaddingEnd(el.clientHeight);
    };

    updatePadding();
    const observer = new ResizeObserver(updatePadding);
    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

  // One-shot restore: settle on scrollTop offset — never retry-fight the user.
  // (overscan makes virtualItems[0].index lag the true top row.)
  useEffect(() => {
    if (pendingRestoreIndex.current == null || status !== "success") {
      return;
    }

    if (paddingEnd === 0 || filteredCats.length === 0) {
      return;
    }

    const el = parentRef.current;
    if (!el || el.clientHeight === 0) {
      return;
    }

    const pending = pendingRestoreIndex.current;

    // Wait for enough filtered rows before restoring when more pages exist.
    if (pending > filteredCats.length - 1 && hasNextPage) {
      return;
    }

    const targetIndex = Math.min(pending, Math.max(filteredCats.length - 1, 0));
    const offset = targetIndex * ROW_HEIGHT;
    const maxScroll = el.scrollHeight - el.clientHeight;

    if (maxScroll < offset) {
      return;
    }

    el.scrollTop = offset;
    pendingRestoreIndex.current = null;
  }, [filteredCats.length, paddingEnd, status, hasNextPage]);

  useEffect(() => {
    const lastItem = virtualItems.at(-1);

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= filteredCats.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    filteredCats.length,
    isFetchingNextPage,
    virtualItems,
  ]);

  useEffect(() => {
    if (status !== "success" || filteredCats.length === 0) {
      return;
    }

    if (pendingRestoreIndex.current != null) {
      return;
    }

    const el = parentRef.current;
    if (!el) {
      return;
    }

    const page = catsPageFromScrollTop(
      el.scrollTop,
      filteredCats.length,
      ROW_HEIGHT,
    );

    if (lastSyncedPage.current === page) {
      return;
    }

    lastSyncedPage.current = page;
    syncUrlParams({ page });
  }, [filteredCats.length, status, virtualItems]);

  if (status === "pending" && !isRefreshing) {
    return <p>Loading...</p>;
  }

  if (status === "error" && !isRefreshing) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Search</span>
          <input
            type="search"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Filter by breed or country"
            className="rounded border border-neutral-300 bg-transparent px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={isRefreshing}
          className="hidden shrink-0 rounded border border-neutral-300 px-3 py-2 text-sm font-medium sm:inline-flex disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {showPullIndicator ? (
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-end justify-center overflow-hidden text-sm text-neutral-600"
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
        <div ref={parentRef} className="h-full min-h-0 overflow-auto">
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {virtualItems.map((virtualRow) => {
              const isLoaderRow = virtualRow.index > filteredCats.length - 1;
              const cat = filteredCats[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  className="absolute left-0 top-0 flex w-full items-center"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    isFetchNextPageError ? (
                      <p>Error loading more cats.</p>
                    ) : hasNextPage ? (
                      <p>Loading more...</p>
                    ) : (
                      <p>Nothing more to load.</p>
                    )
                  ) : cat ? (
                    <p className="truncate">
                      <strong>{cat.breed}</strong>
                      {" — "}
                      {cat.country}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
