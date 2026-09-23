"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";
import RandomFact from "@/components/random-fact";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";
import {
  findBreedBySlug,
  parseCatsPageParam,
  parseCatsSearchParam,
} from "@/lib/queries/cats";
import { useCatsInfiniteQuery } from "@/lib/queries/use-cats-infinite-query";
import { directoryHref } from "@/lib/url/sync-url-params";
import { cn, displayValue } from "@/lib/utils";

const detailCardClass =
  "relative w-full max-w-lg gap-0 overflow-hidden rounded-lg bg-card py-0 ring-1 ring-foreground/10";

function DetailShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center">
      <Card className={cn(detailCardClass, className)}>
        <div className="scratcher-stripe h-1 w-full shrink-0" aria-hidden />
        {children}
      </Card>
    </div>
  );
}

function DetailLoading() {
  return (
    <DetailShell>
      <CardHeader className="gap-3 px-6 pt-6 pb-2">
        <Skeleton className="h-4 w-36 rounded-md bg-muted-foreground/10" />
        <Skeleton className="h-8 w-2/3 rounded-md bg-muted-foreground/15" />
        <Skeleton className="h-4 w-1/3 rounded-md bg-muted-foreground/10" />
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6">
        <Skeleton className="h-4 w-full rounded-md bg-muted-foreground/10" />
        <Skeleton className="h-4 w-5/6 rounded-md bg-muted-foreground/10" />
        <Skeleton className="h-4 w-4/6 rounded-md bg-muted-foreground/10" />
        <Skeleton className="mt-4 h-20 w-full rounded-md bg-muted-foreground/10" />
      </CardContent>
      <p role="status" aria-live="polite" className="sr-only">
        Loading...
      </p>
    </DetailShell>
  );
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
    isFetchNextPageError,
    refetch,
    status,
  } = useCatsInfiniteQuery();

  const cats = data?.pages.flatMap((page) => page.data) ?? [];
  const breed = findBreedBySlug(cats, slug);

  useEffect(() => {
    if (
      breed ||
      status !== "success" ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    breed,
    status,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  useEffect(() => {
    if (!breed) {
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [breed]);

  if (status === "pending") {
    return <DetailLoading />;
  }

  if (status === "error" && !data) {
    return (
      <DetailShell>
        <CardHeader className="gap-2 px-6 pt-6 pb-6">
          <CardTitle className="font-heading text-xl font-semibold tracking-tight">
            Something went wrong
          </CardTitle>
          <QueryError
            className="items-start gap-3 py-0 text-left"
            message={getErrorMessage(error)}
            onRetry={() => void refetch()}
          />
          <Link
            href={backHref}
            className="mt-2 text-sm text-muted-foreground underline-offset-2 hover:underline focus-visible:underline"
          >
            ← Back to directory
          </Link>
        </CardHeader>
      </DetailShell>
    );
  }

  if (breed) {
    return (
      <DetailShell>
        <CardHeader className="gap-1 px-6 pt-5 pb-4">
          <Link
            href={backHref}
            className="mb-2 w-fit text-sm text-muted-foreground underline-offset-2 hover:underline focus-visible:underline"
          >
            ← Back to directory
          </Link>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-3xl font-semibold tracking-tight outline-none"
          >
            {displayValue(breed.breed)}
          </h1>
          <CardDescription className="text-base">
            {displayValue(breed.country)}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <dl className="grid gap-3 border-t border-border/60 pt-4 text-sm sm:grid-cols-[7rem_1fr]">
            <dt className="font-medium text-muted-foreground">Origin</dt>
            <dd>{displayValue(breed.origin)}</dd>
            <dt className="font-medium text-muted-foreground">Coat</dt>
            <dd>{displayValue(breed.coat)}</dd>
            <dt className="font-medium text-muted-foreground">Pattern</dt>
            <dd>{displayValue(breed.pattern)}</dd>
          </dl>

          <div className="mt-6 rounded-md bg-accent/60 px-4 py-4 ring-1 ring-foreground/5">
            <RandomFact slug={slug} />
          </div>
        </CardContent>
      </DetailShell>
    );
  }

  if (isFetchNextPageError) {
    return (
      <DetailShell>
        <CardHeader className="gap-2 px-6 pt-6 pb-6">
          <CardTitle className="font-heading text-xl font-semibold tracking-tight">
            Something went wrong
          </CardTitle>
          <QueryError
            className="items-start gap-3 py-0 text-left"
            message="Error loading more breeds."
            onRetry={() => void fetchNextPage()}
          />
          <Link
            href={backHref}
            className="mt-2 text-sm text-muted-foreground underline-offset-2 hover:underline focus-visible:underline"
          >
            ← Back to directory
          </Link>
        </CardHeader>
      </DetailShell>
    );
  }

  if (hasNextPage || isFetchingNextPage) {
    return <DetailLoading />;
  }

  if (status === "success" && cats.length === 0) {
    return (
      <DetailShell>
        <CardHeader className="gap-2 px-6 pt-6 pb-6">
          <CardTitle className="font-heading text-xl font-semibold tracking-tight">
            No breeds available
          </CardTitle>
          <EmptyState className="py-0 text-left">
            The directory is empty right now.
          </EmptyState>
          <Link
            href={backHref}
            className="mt-2 text-sm text-muted-foreground underline-offset-2 hover:underline focus-visible:underline"
          >
            ← Back to directory
          </Link>
        </CardHeader>
      </DetailShell>
    );
  }

  return notFound();
}
