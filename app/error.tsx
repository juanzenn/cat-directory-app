"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-0 flex-1 flex-col overflow-auto outline-none"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <Card className="relative w-full max-w-lg gap-0 overflow-hidden rounded-lg bg-card py-0 ring-1 ring-foreground/10">
          <div className="scratcher-stripe h-1 w-full shrink-0" aria-hidden />
          <CardHeader className="gap-2 px-6 pt-5 pb-6">
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              Something went wrong
            </CardTitle>
            <CardDescription role="alert" className="text-base text-destructive">
              {error.message || "An unexpected error occurred."}
            </CardDescription>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
              <Link
                href="/"
                className="text-sm text-muted-foreground underline-offset-2 hover:underline focus-visible:underline"
              >
                ← Back to directory
              </Link>
            </div>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
