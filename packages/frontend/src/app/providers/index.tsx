"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { BrandProvider } from "./BrandProvider";
import { ThemeProvider } from "../theme/ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrandProvider>
          {children}
        </BrandProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default Providers;
