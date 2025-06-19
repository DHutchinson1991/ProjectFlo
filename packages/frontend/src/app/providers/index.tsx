"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}

export default Providers;
