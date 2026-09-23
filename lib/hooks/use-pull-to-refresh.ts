"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const DEFAULT_THRESHOLD_PX = 72;

type UsePullToRefreshOptions = {
  scrollRef: RefObject<HTMLElement | null>;
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  disabled?: boolean;
};

export function usePullToRefresh({
  scrollRef,
  onRefresh,
  threshold = DEFAULT_THRESHOLD_PX,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || disabled) {
      return;
    }

    const setDistance = (value: number) => {
      pullDistanceRef.current = value;
      setPullDistance(value);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (el.scrollTop > 0) {
        startY.current = null;
        pulling.current = false;
        return;
      }

      startY.current = event.touches[0]?.clientY ?? null;
      pulling.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY.current == null) {
        return;
      }

      if (el.scrollTop > 0) {
        startY.current = null;
        pulling.current = false;
        setDistance(0);
        return;
      }

      const currentY = event.touches[0]?.clientY ?? startY.current;
      const delta = currentY - startY.current;

      if (delta <= 0) {
        pulling.current = false;
        setDistance(0);
        return;
      }

      pulling.current = true;
      // Resistance so the pull feels natural and caps visually.
      const resisted = Math.min(delta * 0.45, threshold * 1.5);
      setDistance(resisted);

      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!pulling.current) {
        startY.current = null;
        pulling.current = false;
        setDistance(0);
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= threshold;
      startY.current = null;
      pulling.current = false;

      if (!shouldRefresh) {
        setDistance(0);
        return;
      }

      setDistance(threshold);

      void Promise.resolve(onRefreshRef.current())
        .catch(() => {})
        .finally(() => {
          setDistance(0);
        });
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [scrollRef, threshold, disabled]);

  return {
    pullDistance,
    isPulling: pullDistance > 0,
  };
}
