import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeIcon } from "@/components/ui/huge-icon"
import { cn } from "@/lib/utils"
import Link from "next/link"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        destructiveOutline:
          "bg-background shadow-xs ring-2 ring-destructive hover:bg-muted-foreground/10 hover:text-foreground",
        outline:
          "border border-border bg-background shadow-xs hover:bg-muted-foreground/10 hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        transparent: "bg-transparent",
        input: "bg-input text-foreground hover:bg-input/80",
        muted: "bg-muted text-foreground hover:bg-muted/80",
        mutedBordered:
          "bg-muted shadow-xs ring-2 ring-input hover:bg-muted-foreground/10 hover:text-foreground",
        menu: "hover:bg-zinc-700 text-zinc-400 hover:text-white",
        menuActive: "bg-zinc-700 text-white"
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        md: "h-9 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        sm: "h-9 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        xs: "h-8 gap-1 rounded-sm px-2.5 text-xs has-[>svg]:px-2",
        lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
        iconMd: "size-8",
        iconSm: "size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  as?: 'button' | 'a' | 'link'
  href?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, as = 'button', href, ...props }, ref) => {
    let Comp: React.ElementType = as === 'button' ? 'button' : as === 'a' ? 'a' : Link

    if (asChild) {
      Comp = Slot
    }

    const commonProps = {
      className: cn(buttonVariants({ variant, size, className })),
      ref,
      disabled: disabled || isLoading,
      ...props,
    }

    if (as === 'a' && href) {
      return <Comp href={href} {...commonProps}>{isLoading ? <HugeIcon icon={Loading03Icon} size={16} className="animate-spin" /> : children}</Comp>
    }

    if (as === 'link' && href) {
      return <Comp href={href} {...commonProps}>{isLoading ? <HugeIcon icon={Loading03Icon} size={16} className="animate-spin" /> : children}</Comp>
    }

    return (
      <Comp {...commonProps}>
        {isLoading ? <HugeIcon icon={Loading03Icon} size={16} className="animate-spin" /> : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
