import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CatDetail from "@/components/cat-detail";
import { catsInfiniteQueryOptions } from "@/lib/queries/cats";
import { getQueryClient } from "@/lib/query/get-query-client";

export const dynamic = "force-dynamic";

export default async function BreedDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const queryClient = getQueryClient();

  await queryClient.infiniteQuery({
    ...catsInfiniteQueryOptions,
    pages: 1,
  });

  return (
    <main className="flex flex-1 flex-col p-8">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CatDetail slug={slug} />
      </HydrationBoundary>
    </main>
  );
}
