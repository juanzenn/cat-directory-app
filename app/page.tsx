import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CatList from "@/components/cat-list";
import { catsInfiniteQueryOptions } from "@/lib/queries/cats";
import { getQueryClient } from "@/lib/query/get-query-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const queryClient = getQueryClient();

  await queryClient.infiniteQuery(catsInfiniteQueryOptions);

  return (
    <main className="flex min-h-0 flex-1 flex-col p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Cat Directory</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="min-h-0 flex-1">
          <CatList />
        </div>
      </HydrationBoundary>
    </main>
  );
}
