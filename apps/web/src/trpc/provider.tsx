"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./client";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { getApiUrl } from "./get-api-url";


export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();

    // Create a TRPC client with the httpBatchLink and include the auth token in the headers
    const [queryClient] = useState(() => new QueryClient());

   const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getApiUrl(),
          // Fetch the Clerk token and put it in the headers
          async headers() {
            const token = await getToken();
            return {
              Authorization: token ? `Bearer ${token}` : "",
            };
          },
        }),
      ],
    })
  );

   return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
