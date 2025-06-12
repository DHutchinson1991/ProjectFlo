import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers"; // Changed from { Providers }
import ThemeRegistry from "./ThemeRegistry";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ThemeRegistry options={{ key: "mui" }}>
            <Providers>{children}</Providers>
          </ThemeRegistry>
        </ErrorBoundary>
      </body>
    </html>
  );
}
