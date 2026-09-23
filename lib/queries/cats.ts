import { getCats } from "@/lib/api";
import type { Breed, Paginated } from "@/lib/api";

export const CATS_PAGE_SIZE = 10;

export function parseCatsPageParam(
  value: string | string[] | undefined,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? "", 10);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return page;
}

export function parseCatsSearchParam(
  value: string | string[] | undefined,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim();
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

export function catsPageFromScrollTop(
  scrollTop: number,
  itemCount: number,
  rowHeight: number,
) {
  if (itemCount <= 0) {
    return 1;
  }

  const visibleStartIndex = Math.min(
    Math.floor(scrollTop / rowHeight),
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
