"use client";

import { useEffect, type RefObject } from "react";
import { catsPageFromScrollTop } from "@/lib/queries/cats";
import { syncUrlParams } from "@/lib/url/sync-url-params";

type UseSyncPageFromScrollOptions = {
  parentRef: RefObject<HTMLElement | null>;
  lastSyncedPageRef: RefObject<number | null>;
  pendingRestoreIndexRef: RefObject<number | null>;
  status: string;
  filteredCount: number;
  rowHeight: number;
  columns?: number;
  /** Re-run when the virtual range changes (scroll position proxy). */
  virtualItems: unknown;
};

export function useSyncPageFromScroll({
  parentRef,
  lastSyncedPageRef,
  pendingRestoreIndexRef,
  status,
  filteredCount,
  rowHeight,
  columns = 1,
  virtualItems,
}: UseSyncPageFromScrollOptions) {
  useEffect(() => {
    if (status !== "success" || filteredCount === 0) {
      return;
    }

    if (pendingRestoreIndexRef.current != null) {
      return;
    }

    const el = parentRef.current;
    if (!el) {
      return;
    }

    const page = catsPageFromScrollTop(
      el.scrollTop,
      filteredCount,
      rowHeight,
      columns,
    );

    if (lastSyncedPageRef.current === page) {
      return;
    }

    lastSyncedPageRef.current = page;
    syncUrlParams({ page });
  }, [
    columns,
    filteredCount,
    lastSyncedPageRef,
    parentRef,
    pendingRestoreIndexRef,
    rowHeight,
    status,
    virtualItems,
  ]);
}
