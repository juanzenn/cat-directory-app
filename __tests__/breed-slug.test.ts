import { expect, test } from "vitest";
import type { Breed } from "@/lib/api";
import {
  breedToSlug,
  catsPageFromScrollTop,
  catsScrollTopFromIndex,
  findBreedBySlug,
  parseBreedSlug,
  parseCatsPageParam,
  parseCatsSearchParam,
} from "@/lib/queries/cats";

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

test("parseBreedSlug accepts valid slugs", () => {
  expect(parseBreedSlug("abyssinian")).toBe("abyssinian");
  expect(parseBreedSlug("american-bobtail")).toBe("american-bobtail");
});

test("parseBreedSlug rejects invalid slugs", () => {
  expect(parseBreedSlug("")).toBeUndefined();
  expect(parseBreedSlug("Abyssinian")).toBeUndefined();
  expect(parseBreedSlug("foo bar")).toBeUndefined();
  expect(parseBreedSlug("-leading")).toBeUndefined();
});

test("parseCatsPageParam clamps invalid and oversized values", () => {
  expect(parseCatsPageParam(undefined)).toBe(1);
  expect(parseCatsPageParam("0")).toBe(1);
  expect(parseCatsPageParam("abc")).toBe(1);
  expect(parseCatsPageParam("3")).toBe(3);
  expect(parseCatsPageParam("999999")).toBe(1);
});

test("parseCatsSearchParam trims and caps length", () => {
  expect(parseCatsSearchParam("  abi  ")).toBe("abi");
  expect(parseCatsSearchParam("x".repeat(120)).length).toBe(100);
});
test("catsPageFromScrollTop accounts for grid columns", () => {
  const rowHeight = 220;
  expect(catsPageFromScrollTop(12 * rowHeight, 40, rowHeight, 1)).toBe(2);
  expect(catsPageFromScrollTop(rowHeight, 40, rowHeight, 4)).toBe(1);
  expect(catsPageFromScrollTop(3 * rowHeight, 48, rowHeight, 4)).toBe(2);
});

test("catsScrollTopFromIndex maps item index through columns", () => {
  expect(catsScrollTopFromIndex(0, 220, 4)).toBe(0);
  expect(catsScrollTopFromIndex(4, 220, 4)).toBe(220);
  expect(catsScrollTopFromIndex(12, 220, 4)).toBe(660);
});
