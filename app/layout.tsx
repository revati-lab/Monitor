import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory Monitor",
  description: "Smart inventory management and tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <div className="relative flex min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 lg:pl-64">
            {/* Top bar for mobile */}
            <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:hidden">
              <div className="ml-14 flex items-center gap-2">
                <span className="text-lg font-semibold">Inventory Monitor</span>
              </div>
            </header>

            {/* Page content */}
            <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
              <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 bg-card/50">
              <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
                  <p>Inventory Monitor</p>
                  <p>Smart extraction for packing lists</p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
