"use client";

import { useEffect, type RefObject } from "react";

type VirtualItem = {
  index: number;
};

type UseInfiniteVirtualFetchOptions = {
  parentRef: RefObject<HTMLElement | null>;
  virtualItems: VirtualItem[];
  filteredCount: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
};

export function useInfiniteVirtualFetch({
  parentRef,
  virtualItems,
  filteredCount,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseInfiniteVirtualFetchOptions) {
  useEffect(() => {
    const el = parentRef.current;
    // Wait until the scroll element is measured so we don't page-fetch from a
    // pre-layout virtual range (that raced URL ?page= restore).
    if (!el || el.clientHeight === 0) {
      return;
    }

    const lastItem = virtualItems.at(-1);

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= filteredCount - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [
    fetchNextPage,
    filteredCount,
    hasNextPage,
    isFetchingNextPage,
    parentRef,
    virtualItems,
  ]);
}
