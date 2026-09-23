"use client";

import { useState } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getCatsPersistOptions } from "@/lib/query/persist";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [persistOptions] = useState(() => getCatsPersistOptions());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>
    </PersistQueryClientProvider>
  );
}
