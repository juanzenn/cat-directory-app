"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import RandomFact from "@/components/random-fact";
import {
  findBreedBySlug,
  parseCatsPageParam,
  parseCatsSearchParam,
} from "@/lib/queries/cats";
import { useCatsInfiniteQuery } from "@/lib/queries/use-cats-infinite-query";
import { directoryHref } from "@/lib/url/sync-url-params";

function displayValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "—";
}

export default function CatDetail({ slug }: { slug: string }) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const searchParams = useSearchParams();
  const backHref = directoryHref({
    page: parseCatsPageParam(searchParams.get("page") ?? undefined),
    q: parseCatsSearchParam(searchParams.get("q") ?? undefined),
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useCatsInfiniteQuery();

  const cats = data?.pages.flatMap((page) => page.data) ?? [];
  const breed = findBreedBySlug(cats, slug);

  useEffect(() => {
    if (breed || status !== "success" || !hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  }, [
    breed,
    status,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    if (!breed) {
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [breed]);

  if (status === "pending") {
    return (
      <p role="status" aria-live="polite">
        Loading...
      </p>
    );
  }

  if (status === "error" && !data) {
    return <p role="alert">Error: {error.message}</p>;
  }

  if (breed) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href={backHref}
          className="text-sm text-muted underline-offset-2 hover:underline focus-visible:underline"
        >
          ← Back to directory
        </Link>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight outline-none"
        >
          {breed.breed}
        </h1>
        <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-muted">Country</dt>
          <dd>{displayValue(breed.country)}</dd>
          <dt className="font-medium text-muted">Origin</dt>
          <dd>{displayValue(breed.origin)}</dd>
          <dt className="font-medium text-muted">Coat</dt>
          <dd>{displayValue(breed.coat)}</dd>
          <dt className="font-medium text-muted">Pattern</dt>
          <dd>{displayValue(breed.pattern)}</dd>
        </dl>
        <RandomFact slug={slug} />
      </div>
    );
  }

  if (hasNextPage || isFetchingNextPage) {
    return (
      <p role="status" aria-live="polite">
        Loading...
      </p>
    );
  }

  return notFound();
}
