"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Card } from "./card"

const statCardVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        gradient: "bg-gradient-to-br from-primary/5 via-transparent to-transparent",
        accent: "border-l-4 border-l-primary",
        elevated: "shadow-soft-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  loading?: boolean
  /** Optional custom value renderer for clickable stats */
  renderValue?: (value: string | number) => React.ReactNode
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      variant,
      title,
      value,
      description,
      icon,
      trend,
      loading = false,
      renderValue,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(statCardVariants({ variant, className }))}
        {...props}
      >
        <div className="p-6">
          {/* Icon background decoration */}
          {icon && (
            <div className="absolute -right-4 -top-4 h-24 w-24 text-primary/5 pointer-events-none">
              {icon}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              {loading ? (
                <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
              ) : renderValue ? (
                renderValue(value)
              ) : (
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>
              )}
            </div>
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
                {icon}
              </div>
            )}
          </div>

          {/* Trend indicator or description */}
          <div className="mt-3 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  trend.isPositive !== false
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                <svg
                  className={cn(
                    "h-3 w-3",
                    trend.isPositive === false && "rotate-180"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                {trend.value}%
              </span>
            )}
            {(trend?.label || description) && (
              <span className="text-xs text-muted-foreground">
                {trend?.label || description}
              </span>
            )}
          </div>
        </div>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

// Grid container for stat cards with staggered animation
const StatCardGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
})
StatCardGrid.displayName = "StatCardGrid"

export { StatCard, StatCardGrid }
