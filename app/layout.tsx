import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConditionalLayout } from "@/components/conditional-layout";
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
    <ClerkProvider>
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
          <ConditionalLayout>{children}</ConditionalLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}
