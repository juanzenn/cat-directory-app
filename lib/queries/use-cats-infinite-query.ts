"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { catsInfiniteQueryOptions } from "./cats";

export function useCatsInfiniteQuery() {
  return useInfiniteQuery(catsInfiniteQueryOptions);
}
