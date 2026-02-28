"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "./providers/AuthProvider";
import { BrandProvider } from "./providers/BrandProvider";
import ThemeRegistry from "./theme/ThemeRegistry";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeRegistry>
          <BrandProvider>{children}</BrandProvider>
        </ThemeRegistry>
      </AuthProvider>
    </QueryClientProvider>
  );
}
