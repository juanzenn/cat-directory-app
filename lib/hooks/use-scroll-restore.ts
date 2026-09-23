"use client";

import { useEffect, type RefObject } from "react";
import { catsScrollTopFromIndex } from "@/lib/queries/cats";

type UseScrollRestoreOptions = {
  parentRef: RefObject<HTMLElement | null>;
  pendingRestoreIndexRef: RefObject<number | null>;
  status: string;
  paddingEnd: number;
  filteredCount: number;
  hasNextPage: boolean;
  rowHeight: number;
  columns?: number;
};

export function useScrollRestore({
  parentRef,
  pendingRestoreIndexRef,
  status,
  paddingEnd,
  filteredCount,
  hasNextPage,
  rowHeight,
  columns = 1,
}: UseScrollRestoreOptions) {
  // One-shot restore: settle on scrollTop offset — never retry-fight the user.
  // (overscan makes virtualItems[0].index lag the true top row.)
  useEffect(() => {
    if (pendingRestoreIndexRef.current == null || status !== "success") {
      return;
    }

    if (paddingEnd === 0 || filteredCount === 0) {
      return;
    }

    const el = parentRef.current;
    if (!el || el.clientHeight === 0) {
      return;
    }

    const pending = pendingRestoreIndexRef.current;

    // Wait for enough filtered rows before restoring when more pages exist.
    // Never clamp-and-clear early — that wipes ?page=N down to page 1 in the URL.
    if (pending > filteredCount - 1) {
      if (hasNextPage) {
        return;
      }
      pendingRestoreIndexRef.current = null;
      return;
    }

    const offset = catsScrollTopFromIndex(pending, rowHeight, columns);
    const maxScroll = el.scrollHeight - el.clientHeight;

    if (maxScroll < offset) {
      return;
    }

    el.scrollTop = offset;
    pendingRestoreIndexRef.current = null;
  }, [
    columns,
    filteredCount,
    hasNextPage,
    paddingEnd,
    parentRef,
    pendingRestoreIndexRef,
    rowHeight,
    status,
  ]);
}
