"use client"

import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const actionCardVariants = cva(
  "group relative flex flex-col rounded-xl border bg-card p-5 transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-border/50 hover:border-border hover:shadow-soft-md hover:-translate-y-0.5",
        outline:
          "border-border hover:border-primary/50 hover:bg-primary/5",
        gradient:
          "border-transparent bg-gradient-to-br from-primary/5 via-card to-card hover:from-primary/10",
        highlighted:
          "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ActionCardProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    VariantProps<typeof actionCardVariants> {
  href: string
  icon?: React.ReactNode
  title: string
  description?: string
  badge?: string
  external?: boolean
}

const ActionCard = React.forwardRef<HTMLAnchorElement, ActionCardProps>(
  (
    {
      className,
      variant,
      href,
      icon,
      title,
      description,
      badge,
      external = false,
      ...props
    },
    ref
  ) => {
    const Comp = external ? "a" : Link

    return (
      <Comp
        ref={ref}
        href={href}
        className={cn(actionCardVariants({ variant, className }))}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        {...props}
      >
        {/* Arrow indicator */}
        <div className="absolute right-4 top-4 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </div>

        {/* Badge */}
        {badge && (
          <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary group-hover:opacity-0 transition-opacity">
            {badge}
          </span>
        )}

        {/* Icon */}
        {icon && (
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20 [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </div>
        )}

        {/* Content */}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </Comp>
    )
  }
)
ActionCard.displayName = "ActionCard"

// Grid container for action cards
const ActionCardGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 75}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
})
ActionCardGrid.displayName = "ActionCardGrid"

export { ActionCard, ActionCardGrid }
