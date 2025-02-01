import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground text-zinc-200",
        link: "text-primary underline-offset-4 hover:underline",
        menu: "hover:bg-zinc-700 text-zinc-400 hover:text-white",
        menuActive: "bg-zinc-700 text-white"
      },
      size: {
        default: "h-12 px-5 py-2",
        sm: "h-10 rounded-md px-4",
        lg: "h-14 rounded-md px-8",
        icon: "h-12 w-12",
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
    let Comp: any = as === 'button' ? 'button' : as === 'a' ? 'a' : Link

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
      return <Comp href={href} {...commonProps}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}</Comp>
    }

    if (as === 'link' && href) {
      return <Comp href={href} {...commonProps}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}</Comp>
    }

    return (
      <Comp {...commonProps}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
