"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCatsInfiniteQuery } from "@/lib/queries/use-cats-infinite-query";

export default function CatList() {
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

  const cats = data?.pages.flatMap((page) => page.data) ?? [];

  const rowVirtualizer = useVirtualizer({
    count: cats.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 5,
    useFlushSync: false,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= cats.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    cats.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  if (status === "pending") {
    return <p>Loading...</p>;
  }

  if (status === "error") {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div ref={parentRef} className="h-full min-h-0 flex-1 overflow-auto">
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index > cats.length - 1;
          const cat = cats[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
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
                <p>
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
  );
}
