"use client"

import { usePathname } from "next/navigation"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { Sidebar } from "@/components/sidebar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if current page is a sign-in or sign-up page
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')

  // If it's an auth page, render without sidebar
  if (isAuthPage) {
    return <>{children}</>
  }

  // Otherwise, render with sidebar and header
  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 lg:pl-64">
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:hidden">
          <div className="ml-14 flex items-center gap-2">
            <span className="text-lg font-semibold">Inventory Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
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
  )
}
