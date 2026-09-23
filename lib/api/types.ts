import { z } from "zod";

export const CatFactSchema = z.object({
  fact: z.string(),
  length: z.number().int().nonnegative(),
});

export const BreedSchema = z.object({
  breed: z.string(),
  country: z.string(),
  origin: z.string(),
  coat: z.string(),
  pattern: z.string(),
});

export const PaginatedBreedSchema = z
  .object({
    current_page: z.number().int().positive(),
    data: z.array(BreedSchema),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    last_page: z.number().int().positive(),
    next_page_url: z.string().nullable(),
    prev_page_url: z.string().nullable(),
  })
  .passthrough();

export const GetCatsParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const PersistedCatsInfiniteSchema = z.object({
  pages: z.array(PaginatedBreedSchema).max(3),
  pageParams: z.array(z.number().int().positive()),
});

export type CatFact = z.infer<typeof CatFactSchema>;
export type Breed = z.infer<typeof BreedSchema>;
export type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};
export type GetCatsParams = z.infer<typeof GetCatsParamsSchema>;
export type PersistedCatsInfinite = z.infer<typeof PersistedCatsInfiniteSchema>;
