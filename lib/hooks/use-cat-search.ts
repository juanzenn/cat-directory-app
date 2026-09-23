"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { syncUrlParams } from "@/lib/url/sync-url-params";

const SEARCH_DEBOUNCE_MS = 300;

type UseCatSearchOptions = {
  initialQuery?: string;
  parentRef: RefObject<HTMLElement | null>;
  lastSyncedPageRef: RefObject<number | null>;
  pendingRestoreIndexRef: RefObject<number | null>;
};

export function useCatSearch({
  initialQuery = "",
  parentRef,
  lastSyncedPageRef,
  pendingRestoreIndexRef,
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

    lastSyncedPageRef.current = 1;
    pendingRestoreIndexRef.current = null;

    const el = parentRef.current;
    if (el) {
      el.scrollTop = 0;
    }

    syncUrlParams({ page: 1, q: debouncedQuery.trim() });
  }, [debouncedQuery, lastSyncedPageRef, parentRef, pendingRestoreIndexRef]);

  return { inputValue, setInputValue, debouncedQuery };
}
