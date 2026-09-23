import type { Metadata } from "next";
import BreedNotFoundBackLink from "@/components/breed-not-found-back-link";

export const metadata: Metadata = {
  title: "Breed not found · Cat Directory",
};

export default function BreedNotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col gap-4 p-8 outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Breed not found</h1>
      <p className="text-sm text-muted">No breed matches this link.</p>
      <BreedNotFoundBackLink />
    </main>
  );
}
