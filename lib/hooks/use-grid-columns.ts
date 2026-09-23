"use client";

import { useEffect, useState } from "react";

/** Responsive breed grid columns: 1 → sm:2 → lg:4 */
export function useGridColumns() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const sm = window.matchMedia("(min-width: 640px)");
    const lg = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      if (lg.matches) {
        setColumns(4);
      } else if (sm.matches) {
        setColumns(2);
      } else {
        setColumns(1);
      }
    };

    update();
    sm.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      sm.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);

  return columns;
}
