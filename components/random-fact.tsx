"use client";

import { useCatFactQuery } from "@/lib/queries/use-cat-fact-query";

export default function RandomFact({ slug }: { slug: string }) {
  const { data, error, status } = useCatFactQuery(slug);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium tracking-tight">Random fact</h2>
      {status === "pending" ? (
        <p role="status" aria-live="polite">
          Loading...
        </p>
      ) : status === "error" ? (
        <p role="alert">Error: {error.message}</p>
      ) : (
        <p className="text-sm text-muted">{data.fact}</p>
      )}
    </section>
  );
}
