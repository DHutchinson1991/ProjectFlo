"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/features/platform/auth";
import { BrandProvider } from "@/features/platform/brand";
import { ThemeProvider } from "@/shared/theme";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrandProvider>{children}</BrandProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
