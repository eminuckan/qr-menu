"use client"

import * as React from "react"
import { Check, HelpCircleIcon, LaptopIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeIcon, type HugeIconElement } from "@/components/ui/huge-icon"

const themes: Array<{ value: string; label: string; icon: HugeIconElement }> = [
  { value: "system", label: "Sistem", icon: LaptopIcon },
  { value: "light", label: "Açık", icon: Sun03Icon },
  { value: "dark", label: "Koyu", icon: Moon02Icon },
]

export function ThemeMenu() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="input" size="iconMd" className="hidden sm:inline-flex">
          <HugeIcon icon={HelpCircleIcon} size={16} />
          <span className="sr-only">Tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((item) => {
          const active = mounted && theme === item.value

          return (
            <DropdownMenuItem key={item.value} onClick={() => setTheme(item.value)}>
              <HugeIcon icon={item.icon} size={16} className="mr-2" />
              {item.label}
              {active ? <HugeIcon icon={Check} size={16} className="ml-auto" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
