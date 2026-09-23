"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  BreedCard,
  BreedCardSkeleton,
  BREED_CARD_SKELETON_COUNT,
} from "@/components/breed-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

/** Name + country card + gap — tall enough that infinite fetch still triggers. */
const CARD_ROW_HEIGHT = 112;
const GRID_GAP_PX = 16;
const PULL_THRESHOLD_PX = 72;
const SCROLLBAR_GUTTER_PX = 12;

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
          <RefreshCw className="size-4" aria-hidden />
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
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <span className="sr-only">Loading breeds…</span>
      {Array.from({ length: BREED_CARD_SKELETON_COUNT }, (_, index) => (
        <BreedCardSkeleton key={index} />
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
    status,
  } = useCatsInfiniteQuery();

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

  const showLoaderSlot =
    !isEmptyFilter && (Boolean(hasNextPage) || isFetchNextPageError);

  const rowVirtualizer = useVirtualizer({
    count: isEmptyFilter
      ? 0
      : filteredCats.length + (showLoaderSlot ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_ROW_HEIGHT,
    overscan: 3,
    lanes: columns,
    useFlushSync: false,
    paddingEnd,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  // First paint (SSR/hydrate) can have cats but no measured scroll el yet.
  // Keep cards on screen without faking a viewport that triggers fetchNextPage.
  const showVirtualFallback =
    status === "success" &&
    filteredCats.length > 0 &&
    virtualItems.length === 0;
  const showPullIndicator = isPulling && !isRefreshing;
  const pullIndicatorHeight = prefersReducedMotion
    ? showPullIndicator
      ? PULL_THRESHOLD_PX
      : 0
    : pullDistance;

  useScrollRestore({
    parentRef,
    pendingRestoreIndexRef,
    status,
    paddingEnd,
    filteredCount: filteredCats.length,
    hasNextPage: Boolean(hasNextPage),
    rowHeight: CARD_ROW_HEIGHT,
    columns,
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
    lastSyncedPageRef,
    pendingRestoreIndexRef,
    status,
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
  const resultsLabel = debouncedQuery.trim()
    ? filteredCats.length === 0
      ? `No breeds match “${debouncedQuery.trim()}”`
      : `Showing ${filteredCats.length} of ${cats.length} breeds`
    : `${filteredCats.length} breeds`;

  const showEndOfList =
    status === "success" &&
    !isEmptyFilter &&
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
        <p role="alert" className="text-center text-sm text-destructive">
          Error: {error.message}
        </p>
      </div>
    );
  }

  const laneWidthPercent = 100 / columns;
  const gapAdjust = ((columns - 1) * GRID_GAP_PX) / columns;

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
          aria-busy={isRefreshing}
          className="h-full min-h-0 overflow-auto"
          style={{ paddingRight: SCROLLBAR_GUTTER_PX }}
        >
          {isEmptyFilter ? (
            <p
              role="status"
              className="py-8 text-center text-sm text-muted-foreground"
            >
              No breeds match “{debouncedQuery.trim()}”.
            </p>
          ) : (
            <>
              <div
                role="list"
                className="relative w-full"
                style={{
                  height: showVirtualFallback
                    ? `${Math.ceil(filteredCats.length / columns) * CARD_ROW_HEIGHT}px`
                    : `${rowVirtualizer.getTotalSize()}px`,
                }}
              >
                {showVirtualFallback
                  ? filteredCats.map((cat, index) => {
                      const lane = index % columns;
                      const row = Math.floor(index / columns);
                      return (
                        <div
                          key={`fallback-${cat.breed}-${index}`}
                          role="listitem"
                          data-index={index}
                          className="absolute top-0 box-border"
                          style={{
                            height: `${CARD_ROW_HEIGHT}px`,
                            width: `calc(${laneWidthPercent}% - ${gapAdjust}px)`,
                            left: `calc(${lane * laneWidthPercent}% + ${lane * (GRID_GAP_PX / columns)}px)`,
                            paddingBottom: `${GRID_GAP_PX}px`,
                            paddingRight:
                              lane < columns - 1 ? `${GRID_GAP_PX}px` : 0,
                            transform: `translateY(${row * CARD_ROW_HEIGHT}px)`,
                          }}
                        >
                          <BreedCard cat={cat} page={linkPage} q={linkQuery} />
                        </div>
                      );
                    })
                  : virtualItems.map((virtualRow) => {
                      const isLoaderRow =
                        showLoaderSlot &&
                        virtualRow.index > filteredCats.length - 1;
                      const cat = filteredCats[virtualRow.index];
                      const lane = virtualRow.lane;

                      if (isLoaderRow) {
                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            className="absolute top-0 left-0 w-full"
                            style={{
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                              paddingBottom: `${GRID_GAP_PX}px`,
                            }}
                          >
                            {isFetchNextPageError ? (
                              <p
                                role="alert"
                                className="flex h-full items-center justify-center gap-2 text-sm"
                              >
                                <span>Error loading more cats.</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void fetchNextPage()}
                                >
                                  Retry
                                </Button>
                              </p>
                            ) : (
                              <FetchMoreSkeletonRow columns={columns} />
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={virtualRow.key}
                          role="listitem"
                          data-index={virtualRow.index}
                          className="absolute top-0 box-border"
                          style={{
                            height: `${virtualRow.size}px`,
                            width: `calc(${laneWidthPercent}% - ${gapAdjust}px)`,
                            left: `calc(${lane * laneWidthPercent}% + ${lane * (GRID_GAP_PX / columns)}px)`,
                            paddingBottom: `${GRID_GAP_PX}px`,
                            paddingRight:
                              lane < columns - 1 ? `${GRID_GAP_PX}px` : 0,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          {cat ? (
                            <BreedCard
                              cat={cat}
                              page={linkPage}
                              q={linkQuery}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                {showEndOfList ? (
                  <p
                    role="status"
                    className="absolute left-0 right-0 mx-auto max-w-sm border-t border-border/60 pt-4 text-center text-sm text-muted-foreground"
                    style={{
                      top: `${Math.ceil(filteredCats.length / columns) * CARD_ROW_HEIGHT}px`,
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
