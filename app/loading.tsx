import {
  BreedCardSkeleton,
  BREED_CARD_SKELETON_COUNT,
} from "@/components/breed-card";

export default function Loading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden outline-none"
    >
      <h2 className="sr-only">Breeds</h2>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative flex h-full min-h-0 flex-1 flex-col gap-8 overflow-hidden">
          <header className="mx-auto flex w-full max-w-xl shrink-0 flex-col items-center gap-5 text-center">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Cat Directory
            </h1>
          </header>
          <div
            role="status"
            aria-live="polite"
            aria-label="Loading breeds"
            className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-4"
          >
            <span className="sr-only">Loading breeds…</span>
            {Array.from({ length: BREED_CARD_SKELETON_COUNT }, (_, index) => (
              <BreedCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
