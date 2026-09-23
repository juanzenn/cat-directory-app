"use client";

import { useEffect, type RefObject } from "react";

type UseScrollRestoreOptions = {
  parentRef: RefObject<HTMLElement | null>;
  pendingRestoreIndex: RefObject<number | null>;
  status: string;
  paddingEnd: number;
  filteredCount: number;
  hasNextPage: boolean;
  rowHeight: number;
};

export function useScrollRestore({
  parentRef,
  pendingRestoreIndex,
  status,
  paddingEnd,
  filteredCount,
  hasNextPage,
  rowHeight,
}: UseScrollRestoreOptions) {
  // One-shot restore: settle on scrollTop offset — never retry-fight the user.
  // (overscan makes virtualItems[0].index lag the true top row.)
  useEffect(() => {
    if (pendingRestoreIndex.current == null || status !== "success") {
      return;
    }

    if (paddingEnd === 0 || filteredCount === 0) {
      return;
    }

    const el = parentRef.current;
    if (!el || el.clientHeight === 0) {
      return;
    }

    const pending = pendingRestoreIndex.current;

    // Wait for enough filtered rows before restoring when more pages exist.
    // Never clamp-and-clear early — that wipes ?page=N down to page 1 in the URL.
    if (pending > filteredCount - 1) {
      if (hasNextPage) {
        return;
      }
      pendingRestoreIndex.current = null;
      return;
    }

    const offset = pending * rowHeight;
    const maxScroll = el.scrollHeight - el.clientHeight;

    if (maxScroll < offset) {
      return;
    }

    el.scrollTop = offset;
    pendingRestoreIndex.current = null;
  }, [
    filteredCount,
    hasNextPage,
    paddingEnd,
    parentRef,
    pendingRestoreIndex,
    rowHeight,
    status,
  ]);
}
