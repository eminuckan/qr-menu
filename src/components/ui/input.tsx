import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex w-full min-w-0 bg-input/50 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm caret-foreground ring-inset ring-2 ring-border/60 focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/60 dark:aria-invalid:ring-destructive/40 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_var(--input)] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)]",
  {
    variants: {
      size: {
        xs: "h-7 rounded-sm px-2 file:h-4",
        sm: "h-8 rounded-md px-3 file:h-5",
        md: "h-9 rounded-md px-3 file:h-6",
        default: "h-10 rounded-md px-3 file:h-7",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(inputVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
