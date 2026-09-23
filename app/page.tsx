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
    <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-8">
      <h1 className="shrink-0 text-3xl font-semibold tracking-tight">
        Cat Directory
      </h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CatList initialPage={page} initialQuery={query} />
        </div>
      </HydrationBoundary>
    </main>
  );
}
