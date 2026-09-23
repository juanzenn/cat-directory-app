import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CatList from "@/components/cat-list";
import {
  catsInfiniteQueryOptions,
  parseCatsPageParam,
  parseCatsSearchParam,
} from "@/lib/queries/cats";
import { getQueryClient } from "@/lib/query/get-query-client";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}) {
  const queryClient = getQueryClient();
  const params = await searchParams;
  const page = parseCatsPageParam(params.page);
  const query = parseCatsSearchParam(params.q);

  await queryClient.infiniteQuery({
    ...catsInfiniteQueryOptions,
    pages: page,
  });

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden outline-none"
    >
      <h2 className="sr-only">Breeds</h2>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <CatList initialPage={page} initialQuery={query} />
        </div>
      </HydrationBoundary>
    </main>
  );
}
