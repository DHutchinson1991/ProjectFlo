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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Always force dark mode initially to prevent flash
                  document.documentElement.style.colorScheme = 'dark';
                  document.documentElement.style.backgroundColor = '#121212';
                  document.documentElement.setAttribute('data-theme', 'dark');
                  if (document.body) {
                    document.body.style.backgroundColor = '#121212';
                    document.body.style.color = '#ffffff';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background-color: #121212 !important; color: #ffffff !important; }
        `}} />
      </head>
      <body style={{ backgroundColor: '#121212', color: '#ffffff', margin: 0 }}>
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
