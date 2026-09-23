import { z } from "zod";
import { getCatFact, getCats } from "@/lib/api";
import type { Breed, Paginated } from "@/lib/api";

export const CATS_PAGE_SIZE = 12;
export const CATS_MAX_PAGE_PARAM = 1000;
export const CATS_MAX_SEARCH_LENGTH = 100;

const CatsPageParamSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(CATS_MAX_PAGE_PARAM)
  .catch(1);

const CatsSearchParamSchema = z
  .string()
  .trim()
  .transform((value) => value.slice(0, CATS_MAX_SEARCH_LENGTH));
export const BreedSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

function firstSearchParam(
  value: string | string[] | undefined | null,
): string | undefined {
  if (value == null) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export function parseCatsPageParam(
  value: string | string[] | undefined | null,
): number {
  return CatsPageParamSchema.parse(firstSearchParam(value) ?? "");
}

export function parseCatsSearchParam(
  value: string | string[] | undefined | null,
): string {
  return CatsSearchParamSchema.parse(firstSearchParam(value) ?? "");
}

export function parseBreedSlug(value: string): string | undefined {
  const result = BreedSlugSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

export function filterCats(cats: Breed[], q: string): Breed[] {
  const needle = q.trim().toLowerCase();

  if (!needle) {
    return cats;
  }

  return cats.filter(
    (cat) =>
      cat.breed.toLowerCase().includes(needle) ||
      cat.country.toLowerCase().includes(needle),
  );
}

export function breedToSlug(breed: string): string {
  return breed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findBreedBySlug(
  breeds: Breed[],
  slug: string,
): Breed | undefined {
  return breeds.find((cat) => breedToSlug(cat.breed) === slug);
}

export function catsIndexFromPage(page: number) {
  return (page - 1) * CATS_PAGE_SIZE;
}

/** Maps a filtered item index to scrollTop for a multi-column grid. */
export function catsScrollTopFromIndex(
  itemIndex: number,
  rowHeight: number,
  columns: number,
) {
  const cols = Math.max(1, columns);
  return Math.floor(itemIndex / cols) * rowHeight;
}

export function catsPageFromScrollTop(
  scrollTop: number,
  itemCount: number,
  rowHeight: number,
  columns = 1,
) {
  if (itemCount <= 0) {
    return 1;
  }

  const cols = Math.max(1, columns);
  const visibleStartIndex = Math.min(
    Math.floor(scrollTop / rowHeight) * cols,
    itemCount - 1,
  );

  return Math.floor(visibleStartIndex / CATS_PAGE_SIZE) + 1;
}

export const catsInfiniteQueryOptions = {
  queryKey: ["cats"] as const,
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getCats({ page: pageParam, limit: CATS_PAGE_SIZE }),
  initialPageParam: 1,
  getNextPageParam: (lastPage: Paginated<Breed>) =>
    lastPage.current_page < lastPage.last_page
      ? lastPage.current_page + 1
      : undefined,
  networkMode: "offlineFirst" as const,
};

export function catFactQueryOptions(slug: string) {
  return {
    queryKey: ["cat-fact", slug] as const,
    queryFn: getCatFact,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always" as const,
  };
}
