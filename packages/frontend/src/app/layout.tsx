import type { Metadata } from "next";
import "./theme/globals.css";
import Providers from "./providers";
import { ErrorBoundary } from "./components";
import DevConsole from "../components/dev-console/DevConsole";

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
  const showDevConsole = process.env.NODE_ENV !== "production";

  return (
    <html lang="en" data-theme="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <Providers>
            {children}
            {showDevConsole && <DevConsole />}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
