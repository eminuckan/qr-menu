"use client"

import { forwardRef, useId } from "react"
import { Label } from "./label"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { HexColorPicker, HexColorInput } from "react-colorful"
import { cn } from "@/lib/utils"
import { Input } from "./input"

const colorOptions = [
  { value: "#000000", label: "Siyah" },
  { value: "#FFFFFF", label: "Beyaz" },
  { value: "#FFB3B3", label: "Pastel Kırmızı" },
  { value: "#B3FFB3", label: "Pastel Yeşil" },
  { value: "#B3B3FF", label: "Pastel Mavi" },
  { value: "#FFE4B3", label: "Pastel Turuncu" },
  { value: "#FFB3FF", label: "Pastel Pembe" },
]

export interface ColorPickerProps {
  label?: string
  value?: string
  defaultValue?: string
  name?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  error?: boolean
  disabled?: boolean
  className?: string
}

const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(
  ({ label, value, defaultValue, onChange, onBlur, error, disabled, className, name, ...props }, ref) => {
    const id = useId()

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && <Label htmlFor={id}>{label}</Label>}
        <RadioGroup
          name={name}
          value={value}
          defaultValue={defaultValue}
          onValueChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="flex flex-wrap gap-1"
        >
          {colorOptions.map((color) => (
            <div key={color.value} className="flex items-center">
              <RadioGroupItem
                value={color.value}
                id={`${id}-${color.value}`}
                className="peer hidden"
                disabled={disabled}
              />
              <Label
                htmlFor={`${id}-${color.value}`}
                className={cn(
                  "w-6 h-6 rounded-full cursor-pointer border hover:scale-110 transition-transform",
                  disabled && "opacity-50 cursor-not-allowed hover:scale-100"
                )}
                style={{
                  backgroundColor: color.value,
                  boxShadow: value === color.value ? '0 0 0 1px white, 0 0 0 2px #000' : 'none'
                }}
              />
            </div>
          ))}
          <Popover modal>
            <PopoverTrigger asChild disabled={disabled}>
              <div
                className={cn(
                  "w-6 h-6 rounded-full cursor-pointer border hover:scale-110 transition-transform",
                  disabled && "opacity-50 cursor-not-allowed hover:scale-100"
                )}
                style={{
                  background: colorOptions.some(color => color.value === value)
                    ? "linear-gradient(to right, #ff0000, #00ff00, #0000ff)"
                    : value,
                  boxShadow: !colorOptions.some(color => color.value === value)
                    ? '0 0 0 1px white, 0 0 0 2px #000'
                    : 'none'
                }}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="space-y-3">
                <HexColorPicker color={value} onChange={onChange} />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">#</span>
                  <HexColorInput
                    color={value}
                    onChange={onChange}
                    prefixed={false}
                    className={cn(
                      "h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </RadioGroup>
      </div>
    )
  }
)

ColorPicker.displayName = "ColorPicker"

export { ColorPicker }