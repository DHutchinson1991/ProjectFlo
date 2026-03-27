import type { Metadata } from "next";
import "@/shared/theme/globals.css";
import AppProviders from "@/features/platform/providers/AppProviders";
import { ErrorBoundary } from "@/shared/ui";

export const metadata: Metadata = {
  title: "ProjectFlo - Freelancer Management Platform",
  description:
    "Manage your freelance business with ProjectFlo - track projects, clients, and revenue",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body>
        <AppProviders>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AppProviders>
      </body>
    </html>
  );
}
