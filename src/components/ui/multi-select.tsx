"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Check, ChevronsUpDown } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seçiniz...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
        >
          <div className="flex flex-wrap gap-1 truncate">
            {selected.length === 0 && placeholder}
            {selected.map((value) => (
              <Badge
                variant="secondary"
                key={value}
                className="mr-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(selected.filter((v) => v !== value))
                }}
              >
                {options.find((opt) => opt.value === value)?.label}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-[200px] overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-accent",
                selected.includes(option.value) && "bg-accent"
              )}
              onClick={() => {
                onChange(
                  selected.includes(option.value)
                    ? selected.filter((v) => v !== option.value)
                    : [...selected, option.value]
                )
              }}
            >
              <div className="w-4">
                {selected.includes(option.value) && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              {option.label}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
} 