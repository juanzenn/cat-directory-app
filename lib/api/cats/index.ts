import { catFactApi } from "../client";
import type { Breed, CatFact, GetCatsParams, Paginated } from "../types";

export async function getCats(
  params?: GetCatsParams,
): Promise<Paginated<Breed>> {
  const { data } = await catFactApi.get<Paginated<Breed>>("/breeds", {
    params,
  });
  return data;
}

export async function getCatFact(): Promise<CatFact> {
  const { data } = await catFactApi.get<CatFact>("/fact");
  return data;
}
