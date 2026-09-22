"use client";

import { useEffect, useRef } from "react";
import { useCatsInfiniteQuery } from "@/lib/queries/use-cats-infinite-query";

export default function CatList() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    status,
  } = useCatsInfiniteQuery();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasNextPage && !isFetching) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  if (status === "pending") {
    return <p>Loading...</p>;
  }

  if (status === "error") {
    return <p>Error: {error.message}</p>;
  }

  const cats = data.pages.flatMap((page) => page.data);

  return (
    <>
      <ul>
        {cats.map((cat) => (
          <li key={cat.breed}>
            <strong>{cat.breed}</strong>
            {" — "}
            {cat.country}
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} aria-hidden="true" />
      {isFetchingNextPage ? <p>Loading more...</p> : null}
      {isFetchNextPageError ? <p>Error loading more cats.</p> : null}
      {!hasNextPage && !isFetchingNextPage ? (
        <p>Nothing more to load.</p>
      ) : null}
    </>
  );
}
