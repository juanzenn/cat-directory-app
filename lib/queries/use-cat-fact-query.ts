"use client";

import { useQuery } from "@tanstack/react-query";
import { catFactQueryOptions } from "./cats";

export function useCatFactQuery(slug: string) {
  return useQuery(catFactQueryOptions(slug));
}
