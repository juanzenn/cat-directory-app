"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  BreedCard,
  BreedCardSkeleton,
  BREED_CARD_SKELETON_COUNT,
} from "@/components/breed-card";
import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Breed } from "@/lib/api";
import { getErrorMessage } from "@/lib/api/errors";
import { useCatSearch } from "@/lib/hooks/use-cat-search";
import { useCatsRefresh } from "@/lib/hooks/use-cats-refresh";
import { useGridColumns } from "@/lib/hooks/use-grid-columns";
import { useInfiniteVirtualFetch } from "@/lib/hooks/use-infinite-virtual-fetch";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";
import { useScrollPaddingEnd } from "@/lib/hooks/use-scroll-padding-end";
import { useScrollRestore } from "@/lib/hooks/use-scroll-restore";
import { useSyncPageFromScroll } from "@/lib/hooks/use-sync-page-from-scroll";
import {
  CATS_MAX_SEARCH_LENGTH,
  catsIndexFromPage,
  filterCats,
} from "@/lib/queries/cats";
import { useCatsInfiniteQuery } from "@/lib/queries/use-cats-infinite-query";
import { cn } from "@/lib/utils";

/** Name + country card + gap — room for 2-line country on lg. */
const CARD_ROW_HEIGHT = 136;
const GRID_GAP_PX = 16;
const PULL_THRESHOLD_PX = 72;
const SCROLLBAR_GUTTER_PX = 12;
const BREED_GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

function DirectoryHeader({
  inputValue,
  setInputValue,
  onRefresh,
  isRefreshing,
  refreshDisabled,
}: {
  inputValue: string;
  setInputValue: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  refreshDisabled?: boolean;
}) {
  return (
    <header className="mx-auto flex w-full max-w-xl shrink-0 flex-col items-center gap-5 text-center">
      <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Cat Directory
      </h1>
      <div className="flex w-full items-center gap-2">
        <div className="min-w-0 flex-1 text-left">
          <Label htmlFor="breed-search" className="sr-only">
            Search
          </Label>
          <Input
            id="breed-search"
            type="search"
            value={inputValue}
            maxLength={CATS_MAX_SEARCH_LENGTH}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Filter by breed or country"
            className="h-11 rounded-full border-border/80 bg-card px-4 text-base shadow-sm md:text-base"
          />
        </div>
        <Button
          type="button"
          variant="default"
          size="icon-lg"
          onClick={onRefresh}
          disabled={refreshDisabled || isRefreshing}
          aria-label={isRefreshing ? "Refreshing…" : "Refresh"}
          className="shrink-0 rounded-full"
        >
          <RefreshCw
            className={cn("size-4", isRefreshing && "animate-spin")}
            aria-hidden
          />
        </Button>
      </div>
    </header>
  );
}

function RefreshingBadge() {
  return (
    <p
      role="status"
      aria-live="polite"
      className="absolute top-0 right-0 z-20 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm"
    >
      Refreshing…
    </p>
  );
}

function PullIndicator({
  height,
  pullDistance,
}: {
  height: number;
  pullDistance: number;
}) {
  const label =
    pullDistance >= PULL_THRESHOLD_PX
      ? "Release to refresh"
      : "Pull to refresh";

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center overflow-hidden"
      style={{ height: `${height}px` }}
    >
      <div className="flex items-center gap-2.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md ring-1 ring-primary/30">
        <div
          className="h-1.5 w-12 rounded-sm bg-[repeating-linear-gradient(90deg,var(--sisal-cream)_0_5px,transparent_5px_10px)]"
          aria-hidden
        />
        <span>{label}</span>
      </div>
    </div>
  );
}

function PendingSkeletonGrid() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading breeds"
      className={BREED_GRID_CLASS}
    >
      <span className="sr-only">Loading breeds…</span>
      {Array.from({ length: BREED_CARD_SKELETON_COUNT }, (_, index) => (
        <BreedCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** CSS media-query grid — correct columns in SSR HTML before JS matchMedia. */
function CssBreedGrid({
  cats,
  page,
  q,
}: {
  cats: Breed[];
  page: number;
  q: string;
}) {
  return (
    <div
      role="list"
      className={BREED_GRID_CLASS}
      style={{ gridAutoRows: `${CARD_ROW_HEIGHT - GRID_GAP_PX}px` }}
    >
      {cats.map((cat, index) => (
        <div key={`css-${cat.breed}-${index}`} role="listitem" className="min-h-0">
          <BreedCard cat={cat} page={page} q={q} />
        </div>
      ))}
    </div>
  );
}

function FetchMoreSkeletonRow({ columns }: { columns: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading more breeds"
      className="grid h-full w-full gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      <span className="sr-only">Loading more…</span>
      {Array.from({ length: columns }, (_, index) => (
        <BreedCardSkeleton key={index} />
      ))}
    </div>
  );
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
    refetch,
    status,
  } = useCatsInfiniteQuery();
  // SSR + first hydration paint use getServerSnapshot (always 1). Prefer a CSS
  // media-query grid until mount so wide viewports are not stuck in 1 column.
  const [layoutReady, setLayoutReady] = useState(false);
  useEffect(() => {
    setLayoutReady(true);
  }, []);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedPageRef = useRef<number | null>(initialPage);
  const pendingRestoreIndexRef = useRef<number | null>(
    initialPage > 1 ? catsIndexFromPage(initialPage) : null,
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const columns = useGridColumns();

  const { inputValue, setInputValue, debouncedQuery } = useCatSearch({
    initialQuery,
    parentRef,
    lastSyncedPageRef,
    pendingRestoreIndexRef,
  });

  const { refresh, isRefreshing } = useCatsRefresh({
    parentRef,
    lastSyncedPageRef,
    pendingRestoreIndexRef,
  });

  const cats = data?.pages.flatMap((page) => page.data) ?? [];
  const filteredCats = filterCats(cats, debouncedQuery);
  const hasActiveQuery = debouncedQuery.trim().length > 0;
  const isFilterSearching =
    status === "success" &&
    hasActiveQuery &&
    filteredCats.length === 0 &&
    (Boolean(hasNextPage) || isFetchingNextPage);
  const isEmptyFilter =
    status === "success" &&
    hasActiveQuery &&
    filteredCats.length === 0 &&
    !hasNextPage &&
    !isFetchingNextPage &&
    !isFetchNextPageError;
  const isEmptyCatalog =
    status === "success" &&
    !hasActiveQuery &&
    cats.length === 0 &&
    !hasNextPage &&
    !isFetchingNextPage;

  const { pullDistance, isPulling } = usePullToRefresh({
    scrollRef: parentRef,
    onRefresh: refresh,
    threshold: PULL_THRESHOLD_PX,
    disabled: isRefreshing || status !== "success",
  });

  const paddingEnd = useScrollPaddingEnd(parentRef, status);

  const showLoaderSlot =
    !isEmptyFilter &&
    !isEmptyCatalog &&
    (Boolean(hasNextPage) || isFetchNextPageError || isFilterSearching);

  const breedRowCount =
    filteredCats.length === 0 ? 0 : Math.ceil(filteredCats.length / columns);
  const virtualRowCount =
    !layoutReady || isEmptyFilter || isEmptyCatalog || isFilterSearching
      ? 0
      : breedRowCount + (showLoaderSlot ? 1 : 0);

  // Virtualize by rows; each row is a CSS grid matching the pre-mount layout
  // so the handoff from CssBreedGrid does not jump columns/gaps.
  const rowVirtualizer = useVirtualizer({
    count: virtualRowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_ROW_HEIGHT,
    overscan: 3,
    useFlushSync: false,
    paddingEnd,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  // First paint after mount can have cats but no measured scroll el yet.
  const showCssGridFallback =
    !layoutReady ||
    (status === "success" &&
      filteredCats.length > 0 &&
      virtualItems.length === 0);
  const showPullIndicator = isPulling && !isRefreshing;
  const pullIndicatorHeight = prefersReducedMotion
    ? showPullIndicator
      ? PULL_THRESHOLD_PX
      : 0
    : pullDistance;

  useScrollRestore({
    parentRef,
    pendingRestoreIndexRef,
    status: layoutReady ? status : "pending",
    paddingEnd,
    filteredCount: filteredCats.length,
    hasNextPage: Boolean(hasNextPage),
    rowHeight: CARD_ROW_HEIGHT,
    columns,
  });

  useInfiniteVirtualFetch({
    parentRef,
    virtualItems,
    filteredCount: breedRowCount,
    hasNextPage: layoutReady && Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  // Keep paging while a filter has no matches among loaded breeds.
  useEffect(() => {
    if (
      !hasActiveQuery ||
      filteredCats.length > 0 ||
      status !== "success" ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    hasActiveQuery,
    filteredCats.length,
    status,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  useSyncPageFromScroll({
    parentRef,
    lastSyncedPageRef,
    pendingRestoreIndexRef,
    status: layoutReady ? status : "pending",
    filteredCount: filteredCats.length,
    rowHeight: CARD_ROW_HEIGHT,
    columns,
    virtualItems,
  });

  useEffect(() => {
    const main = document.getElementById("main-content");
    main?.focus({ preventScroll: true });
  }, []);

  const linkPage = lastSyncedPageRef.current ?? initialPage;
  const linkQuery = debouncedQuery;
  const resultsLabel = hasActiveQuery
    ? isEmptyFilter
      ? `No breeds match “${debouncedQuery.trim()}”`
      : isFilterSearching
        ? `Searching for “${debouncedQuery.trim()}”`
        : `Showing ${filteredCats.length} of ${cats.length} breeds`
    : isEmptyCatalog
      ? "No breeds available"
      : `${filteredCats.length} breeds`;

  const showEndOfList =
    status === "success" &&
    !isEmptyFilter &&
    !isEmptyCatalog &&
    !isFilterSearching &&
    filteredCats.length > 0 &&
    !hasNextPage &&
    !isFetchNextPageError;

  const header = (
    <DirectoryHeader
      inputValue={inputValue}
      setInputValue={setInputValue}
      onRefresh={() => void refresh()}
      isRefreshing={isRefreshing}
      refreshDisabled={status === "pending" && !data}
    />
  );

  const retryFetchNext = () => {
    void fetchNextPage();
  };

  const retryRefetch = () => {
    void refetch();
  };

  if (status === "pending" && !isRefreshing && !data) {
    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col gap-8 overflow-hidden">
        {header}
        <div
          className="min-h-0 flex-1 overflow-auto"
          style={{ paddingRight: SCROLLBAR_GUTTER_PX }}
        >
          <PendingSkeletonGrid />
        </div>
      </div>
    );
  }

  if (status === "error" && !data && !isRefreshing) {
    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col gap-8 overflow-hidden">
        {header}
        <QueryError
          message={getErrorMessage(error)}
          onRetry={retryRefetch}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-8 overflow-hidden">
      {isRefreshing ? <RefreshingBadge /> : null}
      {header}
      <p role="status" aria-live="polite" className="sr-only">
        {resultsLabel}
      </p>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {showPullIndicator ? (
          <PullIndicator
            height={pullIndicatorHeight}
            pullDistance={pullDistance}
          />
        ) : null}
        <div
          ref={parentRef}
          role="region"
          aria-label="Breed list"
          aria-busy={isRefreshing || isFilterSearching}
          className="h-full min-h-0 overflow-auto"
          style={{ paddingRight: SCROLLBAR_GUTTER_PX }}
        >
          {isEmptyCatalog ? (
            <EmptyState>No breeds available.</EmptyState>
          ) : isEmptyFilter ? (
            <EmptyState>
              No breeds match “{debouncedQuery.trim()}”.
            </EmptyState>
          ) : isFilterSearching ? (
            isFetchNextPageError ? (
              <QueryError
                message="Error searching more breeds."
                onRetry={retryFetchNext}
              />
            ) : (
              <PendingSkeletonGrid />
            )
          ) : showCssGridFallback ? (
            <CssBreedGrid cats={filteredCats} page={linkPage} q={linkQuery} />
          ) : (
            <>
              <div
                role="list"
                className="relative w-full"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {virtualItems.map((virtualRow) => {
                  const isLoaderRow =
                    showLoaderSlot && virtualRow.index >= breedRowCount;

                  if (isLoaderRow) {
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        className="absolute top-0 left-0 w-full"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {isFetchNextPageError ? (
                          <QueryError
                            className="flex h-full flex-row items-center justify-center gap-2"
                            message="Error loading more cats."
                            onRetry={retryFetchNext}
                          />
                        ) : (
                          <FetchMoreSkeletonRow columns={columns} />
                        )}
                      </div>
                    );
                  }

                  const startIndex = virtualRow.index * columns;
                  const rowCats = filteredCats.slice(
                    startIndex,
                    startIndex + columns,
                  );

                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      className="absolute top-0 left-0 grid w-full gap-4"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        paddingBottom: `${GRID_GAP_PX}px`,
                      }}
                    >
                      {rowCats.map((cat, colIndex) => (
                        <div
                          key={`${cat.breed}-${startIndex + colIndex}`}
                          role="listitem"
                        >
                          <BreedCard
                            cat={cat}
                            page={linkPage}
                            q={linkQuery}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
                {showEndOfList ? (
                  <p
                    role="status"
                    className="absolute left-0 right-0 mx-auto max-w-sm border-t border-border/60 pt-4 text-center text-sm text-muted-foreground"
                    style={{
                      top: `${breedRowCount * CARD_ROW_HEIGHT}px`,
                    }}
                  >
                    Nothing more to load.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
