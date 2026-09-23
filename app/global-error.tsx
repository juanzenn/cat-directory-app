"use client";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-full flex-col items-center justify-center bg-background p-6 font-sans text-foreground antialiased">
        <main className="flex w-full max-w-lg flex-col gap-3 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p role="alert" className="text-sm text-destructive">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mx-auto rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
