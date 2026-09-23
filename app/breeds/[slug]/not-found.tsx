"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  parseCatsPageParam,
  parseCatsSearchParam,
} from "@/lib/queries/cats";
import { directoryHref } from "@/lib/url/sync-url-params";

export default function BreedNotFound() {
  const searchParams = useSearchParams();
  const backHref = directoryHref({
    page: parseCatsPageParam(searchParams.get("page") ?? undefined),
    q: parseCatsSearchParam(searchParams.get("q") ?? undefined),
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Breed not found</h1>
      <p className="text-sm text-neutral-600">
        No breed matches this link.
      </p>
      <Link
        href={backHref}
        className="text-sm text-neutral-600 underline-offset-2 hover:underline"
      >
        ← Back to directory
      </Link>
    </main>
  );
}
