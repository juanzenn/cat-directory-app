import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import CatDetail from "@/components/cat-detail";
import {
  catsInfiniteQueryOptions,
  parseBreedSlug,
} from "@/lib/queries/cats";
import { getQueryClient } from "@/lib/query/get-query-client";

export const dynamic = "force-dynamic";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseBreedSlug(slug);
  if (!parsed) {
    return { title: "Breed not found · Cat Directory" };
  }
  return { title: `${titleFromSlug(parsed)} · Cat Directory` };
}

export default async function BreedDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsedSlug = parseBreedSlug(slug);
  if (!parsedSlug) {
    notFound();
  }

  const queryClient = getQueryClient();

  await queryClient.infiniteQuery({
    ...catsInfiniteQueryOptions,
    pages: 1,
  });

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col p-8 outline-none"
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CatDetail slug={parsedSlug} />
      </HydrationBoundary>
    </main>
  );
}
