"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCatFactQuery } from "@/lib/queries/use-cat-fact-query";

export default function RandomFact({ slug }: { slug: string }) {
  const { data, error, status } = useCatFactQuery(slug);

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
        <p role="alert" className="text-sm text-destructive">
          Error: {error.message}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-foreground/90">{data.fact}</p>
      )}
    </section>
  );
}
