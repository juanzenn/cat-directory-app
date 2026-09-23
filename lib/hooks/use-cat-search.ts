"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { syncUrlParams } from "@/lib/url/sync-url-params";

const SEARCH_DEBOUNCE_MS = 300;

type UseCatSearchOptions = {
  initialQuery?: string;
  parentRef: RefObject<HTMLElement | null>;
  lastSyncedPage: RefObject<number | null>;
  pendingRestoreIndex: RefObject<number | null>;
};

export function useCatSearch({
  initialQuery = "",
  parentRef,
  lastSyncedPage,
  pendingRestoreIndex,
}: UseCatSearchOptions) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);
  const prevDebouncedQuery = useRef(debouncedQuery);

  useEffect(() => {
    // Skip mount / Strict-Mode re-invoke when the value did not actually change.
    // A one-shot "first run" flag flips on the first invoke, so Strict Mode's
    // second invoke would wipe pendingRestore and ?page=.
    if (prevDebouncedQuery.current === debouncedQuery) {
      return;
    }
    prevDebouncedQuery.current = debouncedQuery;

    lastSyncedPage.current = 1;
    pendingRestoreIndex.current = null;

    const el = parentRef.current;
    if (el) {
      el.scrollTop = 0;
    }

    syncUrlParams({ page: 1, q: debouncedQuery.trim() });
  }, [debouncedQuery, lastSyncedPage, parentRef, pendingRestoreIndex]);

  return { inputValue, setInputValue, debouncedQuery };
}
