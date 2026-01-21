"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "gradient"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      action,
      secondaryAction,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in",
          className
        )}
        {...props}
      >
        {/* Icon with subtle animation */}
        {icon && (
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50 [&>svg]:h-10 [&>svg]:w-10">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="max-w-sm space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            {action && (
              <Button
                variant={action.variant || "default"}
                onClick={action.onClick}
                className="min-w-[140px]"
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="ghost" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

// Preset empty states for common scenarios
const NoDataEmptyState = ({
  onAction,
  ...props
}: Omit<EmptyStateProps, "icon" | "title" | "description"> & {
  onAction?: () => void
}) => (
  <EmptyState
    icon={
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
    }
    title="No data yet"
    description="Get started by adding your first item. It only takes a moment."
    action={
      onAction
        ? {
            label: "Add first item",
            onClick: onAction,
          }
        : undefined
    }
    {...props}
  />
)

const NoSearchResultsEmptyState = ({
  searchTerm,
  onClear,
  ...props
}: Omit<EmptyStateProps, "icon" | "title" | "description"> & {
  searchTerm?: string
  onClear?: () => void
}) => (
  <EmptyState
    icon={
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    }
    title="No results found"
    description={
      searchTerm
        ? `We couldn't find anything matching "${searchTerm}". Try adjusting your search.`
        : "We couldn't find any matches. Try adjusting your filters."
    }
    action={
      onClear
        ? {
            label: "Clear search",
            onClick: onClear,
            variant: "outline",
          }
        : undefined
    }
    {...props}
  />
)

const ErrorEmptyState = ({
  onRetry,
  ...props
}: Omit<EmptyStateProps, "icon" | "title" | "description"> & {
  onRetry?: () => void
}) => (
  <EmptyState
    icon={
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    }
    title="Something went wrong"
    description="We encountered an error while loading your data. Please try again."
    action={
      onRetry
        ? {
            label: "Try again",
            onClick: onRetry,
          }
        : undefined
    }
    {...props}
  />
)

export {
  EmptyState,
  NoDataEmptyState,
  NoSearchResultsEmptyState,
  ErrorEmptyState,
}
