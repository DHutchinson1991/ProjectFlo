"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/features/platform/auth/AuthProvider";
import { BrandProvider } from "./providers/BrandProvider";
import { ThemeProvider } from "@/shared/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
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
