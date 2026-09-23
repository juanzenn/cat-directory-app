"use client";

import { useEffect, useState, type RefObject } from "react";

export function useScrollPaddingEnd(
  parentRef: RefObject<HTMLElement | null>,
  status: string,
) {
  const [paddingEnd, setPaddingEnd] = useState(0);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const el = parentRef.current;
    if (!el) {
      return;
    }

    const updatePadding = () => {
      setPaddingEnd(el.clientHeight);
    };

    updatePadding();
    const observer = new ResizeObserver(updatePadding);
    observer.observe(el);
    return () => observer.disconnect();
  }, [parentRef, status]);

  return paddingEnd;
}
