"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api/src/trpc/router";
import { useState } from "react";
import { getApiUrl } from "./get-api-url";

export const publicTrpc = createTRPCReact<AppRouter>();

export function PublicTRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    publicTrpc.createClient({
      links: [
        httpBatchLink({
          url: getApiUrl(),
        }),
      ],
    })
  );

  return (
    <publicTrpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </publicTrpc.Provider>
  );
}
