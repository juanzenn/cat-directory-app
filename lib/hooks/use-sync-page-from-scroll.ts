"use client";

import { useEffect, type RefObject } from "react";
import { catsPageFromScrollTop } from "@/lib/queries/cats";
import { syncUrlParams } from "@/lib/url/sync-url-params";

type UseSyncPageFromScrollOptions = {
  parentRef: RefObject<HTMLElement | null>;
  lastSyncedPage: RefObject<number | null>;
  pendingRestoreIndex: RefObject<number | null>;
  status: string;
  filteredCount: number;
  rowHeight: number;
  /** Re-run when the virtual range changes (scroll position proxy). */
  virtualItems: unknown;
};

export function useSyncPageFromScroll({
  parentRef,
  lastSyncedPage,
  pendingRestoreIndex,
  status,
  filteredCount,
  rowHeight,
  virtualItems,
}: UseSyncPageFromScrollOptions) {
  useEffect(() => {
    if (status !== "success" || filteredCount === 0) {
      return;
    }

    if (pendingRestoreIndex.current != null) {
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
    );

    if (lastSyncedPage.current === page) {
      return;
    }

    lastSyncedPage.current = page;
    syncUrlParams({ page });
  }, [
    filteredCount,
    lastSyncedPage,
    parentRef,
    pendingRestoreIndex,
    rowHeight,
    status,
    virtualItems,
  ]);
}
