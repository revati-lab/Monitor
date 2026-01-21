"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (systemPrefersDark) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm" className={className}>
        <span className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      className={cn("relative", className)}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {/* Sun icon */}
      <svg
        className={cn(
          "h-4 w-4 transition-all duration-300",
          theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>
      {/* Moon icon */}
      <svg
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        />
      </svg>
    </Button>
  )
}
