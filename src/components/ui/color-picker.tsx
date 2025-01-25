"use client"

import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  presetColors?: Array<{ value: string; label: string }>
  className?: string
}

export function ColorPicker({ 
  color, 
  onChange, 
  presetColors,
  className 
}: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "w-6 h-6 rounded-full border border-muted flex items-center justify-center cursor-pointer",
            className
          )}
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3" 
        onClick={(e) => e.stopPropagation()}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <HexColorPicker color={color} onChange={onChange} />
          {presetColors && (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {presetColors.map((preset) => (
                <div
                  key={preset.value}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "h-6 w-6 rounded-md border border-muted cursor-pointer",
                    color === preset.value && 
                    "ring-2 ring-offset-2 ring-offset-background ring-primary"
                  )}
                  style={{ backgroundColor: preset.value }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(preset.value);
                  }}
                  title={preset.label}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}