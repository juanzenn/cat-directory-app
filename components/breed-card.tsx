import Link from "next/link";
import type { Breed } from "@/lib/api";
import { breedToSlug } from "@/lib/queries/cats";
import { buildCatsSearchString } from "@/lib/url/sync-url-params";
import { cn, displayValue } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const cardShellClass =
  "relative h-full gap-0 overflow-hidden rounded-lg bg-card py-0 ring-1 ring-foreground/10";

export function BreedCard({
  cat,
  page,
  q,
}: {
  cat: Breed;
  page: number;
  q: string;
}) {
  const href = `/breeds/${breedToSlug(cat.breed)}${buildCatsSearchString({ page, q })}`;

  return (
    <Card
      className={cn(
        cardShellClass,
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
      )}
    >
      <div className="scratcher-stripe h-1 w-full shrink-0" aria-hidden />
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col outline-none"
      >
        <CardHeader className="gap-1 px-4 py-4">
          <CardTitle className="font-heading text-base font-semibold tracking-tight">
            {displayValue(cat.breed)}
          </CardTitle>
          <CardDescription className="text-sm">
            {displayValue(cat.country)}
          </CardDescription>
        </CardHeader>
      </Link>
    </Card>
  );
}

export function BreedCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      aria-hidden
      className={cn(cardShellClass, "pointer-events-none", className)}
    >
      <div className="scratcher-stripe h-1 w-full shrink-0" />
      <CardHeader className="gap-2 px-4 py-4">
        <Skeleton className="h-5 w-3/4 rounded-md bg-muted-foreground/15" />
        <Skeleton className="h-4 w-1/2 rounded-md bg-muted-foreground/10" />
      </CardHeader>
    </Card>
  );
}

export const BREED_CARD_SKELETON_COUNT = 12;
