"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  catsIndexFromPage,
  catsPageFromScrollTop,
} from "@/lib/queries/cats";
import { useCatsInfiniteQuery } from "@/lib/queries/use-cats-infinite-query";

const ROW_HEIGHT = 44;

function syncPageToUrl(page: number) {
  const url = new URL(window.location.href);

  if (page <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(page));
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}

export default function CatList({ initialPage = 1 }: { initialPage?: number }) {
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
  const [paddingEnd, setPaddingEnd] = useState(0);

  const cats = data?.pages.flatMap((page) => page.data) ?? [];

  const rowVirtualizer = useVirtualizer({
    count: cats.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    useFlushSync: false,
    paddingEnd,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

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

    if (paddingEnd === 0 || cats.length === 0) {
      return;
    }

    const el = parentRef.current;
    if (!el || el.clientHeight === 0) {
      return;
    }

    const targetIndex = Math.min(
      pendingRestoreIndex.current,
      cats.length - 1,
    );
    const offset = targetIndex * ROW_HEIGHT;
    const maxScroll = el.scrollHeight - el.clientHeight;

    if (maxScroll < offset) {
      return;
    }

    el.scrollTop = offset;
    pendingRestoreIndex.current = null;
  }, [cats.length, paddingEnd, status]);

  useEffect(() => {
    const lastItem = virtualItems.at(-1);

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
    virtualItems,
  ]);

  useEffect(() => {
    if (status !== "success" || cats.length === 0) {
      return;
    }

    if (pendingRestoreIndex.current != null) {
      return;
    }

    const el = parentRef.current;
    if (!el) {
      return;
    }

    const page = catsPageFromScrollTop(el.scrollTop, cats.length, ROW_HEIGHT);

    if (lastSyncedPage.current === page) {
      return;
    }

    lastSyncedPage.current = page;
    syncPageToUrl(page);
  }, [cats.length, status, virtualItems]);

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
        {virtualItems.map((virtualRow) => {
          const isLoaderRow = virtualRow.index > cats.length - 1;
          const cat = cats[virtualRow.index];

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
  );
}
