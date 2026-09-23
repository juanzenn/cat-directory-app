import { QueryClient, environmentManager } from "@tanstack/react-query";

/** Incremental backoff: 1s, 2s, 4s… capped at 30s. Used with `retry: 3`. */
export function queryRetryDelay(attemptIndex: number) {
  return Math.min(1000 * 2 ** attemptIndex, 30_000);
}

export const QUERY_RETRY_COUNT = 3;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: QUERY_RETRY_COUNT,
        retryDelay: queryRetryDelay,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
