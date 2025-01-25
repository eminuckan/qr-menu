"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { AllergenType, AllergenLabels } from "@/types/database"

interface AllergenSelectProps {
  selected: AllergenType[]
  onChange: (values: AllergenType[]) => void
  className?: string
}

export function AllergenSelect({
  selected,
  onChange,
  className,
}: AllergenSelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between h-auto min-h-[2.5rem] py-2", className)}
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Alerjen seçin</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selected.map((allergen) => (
                <Badge
                  variant="secondary"
                  key={allergen}
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(selected.filter((a) => a !== allergen))
                  }}
                >
                  {AllergenLabels[allergen]}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2" align="start">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(AllergenLabels).map(([key, label]) => {
            const isSelected = selected.includes(key as AllergenType)
            return (
              <Button
                key={key}
                variant={isSelected ? "secondary" : "ghost"}
                className={cn(
                  "justify-start font-normal",
                  isSelected && "bg-accent"
                )}
                onClick={() => {
                  const allergen = key as AllergenType
                  onChange(
                    selected.includes(allergen)
                      ? selected.filter((a) => a !== allergen)
                      : [...selected, allergen]
                  )
                }}
              >
                <span className={cn(
                  "mr-2 h-4 w-4 border rounded-sm",
                  isSelected && "bg-primary border-primary"
                )} />
                {label}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
} 