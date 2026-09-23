"use client";

import { useRef, useState, type RefObject } from "react";
import {
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { Breed, Paginated } from "@/lib/api";
import { catsInfiniteQueryOptions } from "@/lib/queries/cats";
import { syncUrlParams } from "@/lib/url/sync-url-params";

type UseCatsRefreshOptions = {
  parentRef: RefObject<HTMLElement | null>;
  lastSyncedPageRef: RefObject<number | null>;
  pendingRestoreIndexRef: RefObject<number | null>;
};

export function useCatsRefresh({
  parentRef,
  lastSyncedPageRef,
  pendingRestoreIndexRef,
}: UseCatsRefreshOptions) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  const refresh = async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    pendingRestoreIndexRef.current = null;
    lastSyncedPageRef.current = 1;

    const el = parentRef.current;
    if (el) {
      el.scrollTop = 0;
    }

    syncUrlParams({ page: 1 });

    try {
      queryClient.setQueryData<InfiniteData<Paginated<Breed>, number>>(
        catsInfiniteQueryOptions.queryKey,
        (old) => {
          if (!old?.pages.length) {
            return old;
          }

          return {
            pages: old.pages.slice(0, 1),
            pageParams: old.pageParams.slice(0, 1),
          };
        },
      );

      await queryClient.refetchQueries({
        queryKey: catsInfiniteQueryOptions.queryKey,
      });
    } catch {
      // Keep cached page-1 data visible when the network refresh fails.
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing };
}
