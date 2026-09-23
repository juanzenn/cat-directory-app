import Link from "next/link";

export default function BreedNotFound() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Breed not found</h1>
      <p className="text-sm text-neutral-600">
        No breed matches this link.
      </p>
      <Link
        href="/"
        className="text-sm text-neutral-600 underline-offset-2 hover:underline"
      >
        ← Back to directory
      </Link>
    </main>
  );
}
