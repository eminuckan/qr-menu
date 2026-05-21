import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md px-2 py-[3px] text-xs font-medium ring-1 ring-inset ring-transparent transition-[color,box-shadow,background-color] focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground ring-primary/20 [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground ring-secondary/20 [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white ring-destructive/25 [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline: "bg-background text-foreground ring-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success: "bg-success text-success-foreground ring-success/35 [a&]:hover:bg-success/90",
        warning: "bg-warning text-warning-foreground ring-warning/40 [a&]:hover:bg-warning/20",
        accent: "bg-accent text-accent-foreground ring-accent/25 [a&]:hover:bg-accent/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
