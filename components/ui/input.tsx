"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-foreground transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input shadow-soft-xs focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        ghost:
          "border-transparent hover:bg-accent focus-visible:bg-accent focus-visible:ring-0",
        filled:
          "border-transparent bg-muted focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary/20",
      },
      inputSize: {
        sm: "h-9 px-3 py-2 text-sm",
        default: "h-11 px-4 py-2.5 text-base",
        lg: "h-12 px-5 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      icon,
      iconPosition = "left",
      error,
      ...props
    },
    ref
  ) => {
    if (icon) {
      return (
        <div className="relative">
          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize }),
              iconPosition === "left" ? "pl-11" : "pr-11",
              error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
              className
            )}
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none [&>svg]:h-5 [&>svg]:w-5",
              iconPosition === "left" ? "left-3.5" : "right-3.5"
            )}
          >
            {icon}
          </div>
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant, inputSize }),
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Search input with built-in icon
const SearchInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "icon" | "iconPosition">
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    type="search"
    icon={
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    }
    iconPosition="left"
    className={cn("[&::-webkit-search-cancel-button]:hidden", className)}
    {...props}
  />
))
SearchInput.displayName = "SearchInput"

export { Input, SearchInput, inputVariants }
