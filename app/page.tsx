import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CatList from "@/components/cat-list";
import { catsInfiniteQueryOptions } from "@/lib/queries/cats";
import { getQueryClient } from "@/lib/query/get-query-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery(catsInfiniteQueryOptions);

  return (
    <main className="flex flex-1 flex-col p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Cat Directory</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CatList />
      </HydrationBoundary>
    </main>
  );
}
