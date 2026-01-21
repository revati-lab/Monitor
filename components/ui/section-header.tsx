"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
        {...props}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="mt-3 sm:mt-0">{action}</div>}
      </div>
    )
  }
)
SectionHeader.displayName = "SectionHeader"

// Page header with larger title
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  badge?: React.ReactNode
  action?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, badge, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2 pb-8 animate-fade-in", className)}
        {...props}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-base text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

export { SectionHeader, PageHeader }
