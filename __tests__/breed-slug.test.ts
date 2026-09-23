import { expect, test } from "vitest";
import type { Breed } from "@/lib/api";
import { breedToSlug, findBreedBySlug } from "@/lib/queries/cats";

const breeds: Breed[] = [
  {
    breed: "Abyssinian",
    country: "Ethiopia",
    origin: "Natural/Standard",
    coat: "Short",
    pattern: "Ticked",
  },
  {
    breed: "American Bobtail",
    country: "United States",
    origin: "Mutation",
    coat: "Short/Long",
    pattern: "All",
  },
];

test("breedToSlug lowercases and hyphenates", () => {
  expect(breedToSlug("Abyssinian")).toBe("abyssinian");
  expect(breedToSlug("American Bobtail")).toBe("american-bobtail");
  expect(breedToSlug("  Foo / Bar  ")).toBe("foo-bar");
});

test("findBreedBySlug returns matching breed", () => {
  expect(findBreedBySlug(breeds, "abyssinian")).toEqual(breeds[0]);
  expect(findBreedBySlug(breeds, "american-bobtail")).toEqual(breeds[1]);
});

test("findBreedBySlug returns undefined when missing", () => {
  expect(findBreedBySlug(breeds, "siamese")).toBeUndefined();
});
