import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import type * as React from "react"

import { cn } from "@/lib/utils"

export function HugeIcon({
  icon,
  className,
  size = 18,
  strokeWidth = 1.7,
  ...props
}: Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon" | "size" | "strokeWidth"> & {
  icon: IconSvgElement
  size?: number | string
  strokeWidth?: number
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color="currentColor"
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

export type { IconSvgElement as HugeIconElement }
