"use client";

import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";
import { useCatFactQuery } from "@/lib/queries/use-cat-fact-query";

export default function RandomFact({ slug }: { slug: string }) {
  const { data, error, refetch, status } = useCatFactQuery(slug);
  const fact = data?.fact?.trim() ?? "";

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-sm font-semibold tracking-tight text-accent-foreground">
        Random fact
      </h2>
      {status === "pending" ? (
        <>
          <div className="space-y-2" aria-hidden>
            <Skeleton className="h-4 w-full rounded-md bg-muted-foreground/10" />
            <Skeleton className="h-4 w-5/6 rounded-md bg-muted-foreground/10" />
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            Loading...
          </p>
        </>
      ) : status === "error" ? (
        <QueryError
          className="items-start gap-2 py-0 text-left"
          message={getErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : fact.length === 0 ? (
        <EmptyState className="py-0 text-left">
          No fact available right now.
        </EmptyState>
      ) : (
        <p className="text-sm leading-relaxed text-foreground/90">{fact}</p>
      )}
    </section>
  );
}
