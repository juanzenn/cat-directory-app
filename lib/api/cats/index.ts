import { catFactApi } from "../client";
import {
  CatFactSchema,
  GetCatsParamsSchema,
  PaginatedBreedSchema,
  type Breed,
  type CatFact,
  type GetCatsParams,
  type Paginated,
} from "../types";

export async function getCats(
  params?: GetCatsParams,
): Promise<Paginated<Breed>> {
  const validatedParams = params
    ? GetCatsParamsSchema.parse(params)
    : undefined;
  const { data } = await catFactApi.get("/breeds", {
    params: validatedParams,
  });
  return PaginatedBreedSchema.parse(data);
}

export async function getCatFact(): Promise<CatFact> {
  const { data } = await catFactApi.get("/fact");
  return CatFactSchema.parse(data);
}
