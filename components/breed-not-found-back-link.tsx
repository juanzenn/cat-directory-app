"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  parseCatsPageParam,
  parseCatsSearchParam,
} from "@/lib/queries/cats";
import { directoryHref } from "@/lib/url/sync-url-params";

export default function BreedNotFoundBackLink() {
  const searchParams = useSearchParams();
  const backHref = directoryHref({
    page: parseCatsPageParam(searchParams.get("page") ?? undefined),
    q: parseCatsSearchParam(searchParams.get("q") ?? undefined),
  });

  return (
    <Link
      href={backHref}
      className="text-sm text-muted underline-offset-2 hover:underline focus-visible:underline"
    >
      ← Back to directory
    </Link>
  );
}
