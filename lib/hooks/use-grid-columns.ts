"use client";

import { useSyncExternalStore } from "react";

const SM_QUERY = "(min-width: 640px)";
const LG_QUERY = "(min-width: 1024px)";

/** Responsive breed grid columns: 1 → sm:2 → lg:4 */
function getGridColumns(): number {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return 1;
  }
  if (window.matchMedia(LG_QUERY).matches) {
    return 4;
  }
  if (window.matchMedia(SM_QUERY).matches) {
    return 2;
  }
  return 1;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window.matchMedia !== "function") {
    return () => {};
  }

  const sm = window.matchMedia(SM_QUERY);
  const lg = window.matchMedia(LG_QUERY);
  sm.addEventListener("change", onStoreChange);
  lg.addEventListener("change", onStoreChange);
  return () => {
    sm.removeEventListener("change", onStoreChange);
    lg.removeEventListener("change", onStoreChange);
  };
}

function getServerSnapshot() {
  return 1;
}

export function useGridColumns() {
  return useSyncExternalStore(subscribe, getGridColumns, getServerSnapshot);
}
