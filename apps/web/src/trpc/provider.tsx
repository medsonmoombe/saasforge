"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./client";
import { useRef, useMemo } from "react";
import { getApiUrl } from "./get-api-url";
import { useAuthContext } from "@/lib/auth-context";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function makeTrpcClient(getToken: () => string | null) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getApiUrl(),
        headers() {
          const token = getToken();
          return { Authorization: token ? `Bearer ${token}` : "" };
        },
      }),
    ],
  });
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthContext();

  // Track previous token to detect changes
  const prevTokenRef = useRef<string | null>(token);

  // Stable queryClient — recreated when token changes (org switch)
  const queryClientRef = useRef<QueryClient>(makeQueryClient());
  if (prevTokenRef.current !== token) {
    queryClientRef.current.clear(); // wipe all cached data on token change
    queryClientRef.current = makeQueryClient();
    prevTokenRef.current = token;
  }

  // tRPC client reads token from closure at request time — always fresh
  const trpcClient = useMemo(
    () => makeTrpcClient(() => typeof window !== "undefined" ? localStorage.getItem("token") : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClientRef.current}>
      <QueryClientProvider client={queryClientRef.current}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
