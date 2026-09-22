import { getCats } from "@/lib/api";
import type { Breed, Paginated } from "@/lib/api";

export const catsInfiniteQueryOptions = {
  queryKey: ["cats"] as const,
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getCats({ page: pageParam, limit: 10 }),
  initialPageParam: 1,
  getNextPageParam: (lastPage: Paginated<Breed>) =>
    lastPage.current_page < lastPage.last_page
      ? lastPage.current_page + 1
      : undefined,
};
