"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
    variant: {
      default: "text-primary",
      muted: "text-muted-foreground",
      white: "text-white",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
})

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, variant, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={cn(spinnerVariants({ size, variant, className }))}
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
)
Spinner.displayName = "Spinner"

// Premium loading dots animation
const LoadingDots = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-1", className)} {...props}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className={cn(
          "h-2 w-2 rounded-full bg-primary animate-bounce",
          i === 1 && "animation-delay-100",
          i === 2 && "animation-delay-200"
        )}
        style={{ animationDelay: `${i * 150}ms` }}
      />
    ))}
  </div>
))
LoadingDots.displayName = "LoadingDots"

// Pulse loader for skeleton states
const PulseLoader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { lines?: number }
>(({ className, lines = 3, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-3", className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "h-4 rounded-md bg-muted animate-pulse",
          i === lines - 1 && "w-3/4"
        )}
        style={{ animationDelay: `${i * 100}ms` }}
      />
    ))}
  </div>
))
PulseLoader.displayName = "PulseLoader"

// Full page loading overlay
interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, message = "Loading...", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  )
)
LoadingOverlay.displayName = "LoadingOverlay"

export { Spinner, LoadingDots, PulseLoader, LoadingOverlay, spinnerVariants }
