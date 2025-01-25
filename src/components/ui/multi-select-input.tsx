"use client"
import * as React from "react"
import Select, { components, MultiValueProps, GroupBase } from "react-select"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

interface Option {
  value: string
  label: string
}

interface MultiSelectInputProps {
  options: Option[]
  value: Option[]
  onChange: (value: Option[]) => void
  placeholder?: string
  className?: string
  isSearchable?: boolean
}

const MultiValue = ({ children, ...props }: MultiValueProps<Option, true, GroupBase<Option>>) => {
  return (
    <components.MultiValue {...props}>
      <Badge 
        variant="secondary" 
        className="h-7 rounded-md text-sm font-normal px-2 hover:bg-secondary/80 whitespace-nowrap"
      >
        {children}
        <X
          className="ml-2 h-4 w-4 cursor-pointer hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            props.removeProps?.onClick?.(e as any)
          }}
        />
      </Badge>
    </components.MultiValue>
  )
}

export function MultiSelectInput({
  options,
  value,
  onChange,
  placeholder = "Seçiniz...",
  className,
  isSearchable = true,
}: MultiSelectInputProps) {
  return (
    <Select
      isMulti
      options={options}
      value={value}
      onChange={(newValue) => onChange(newValue as Option[])}
      placeholder={placeholder}
      isSearchable={isSearchable}
      className={cn("react-select-container", className)}
      classNames={{
        control: (state) =>
          cn(
            "!flex !min-h-12 !w-full !rounded-md !border !border-input !bg-background !px-3 !text-base !ring-offset-background",
            "!h-auto",
            state.isFocused && "!ring-2 !ring-ring !ring-offset-2 !outline-none",
            "hover:!border-input"
          ),
        placeholder: () => "!text-muted-foreground",
        input: () => "!text-foreground !m-0 !p-0",
        menu: () => "!bg-popover !border !border-input !rounded-md !mt-2 !p-1",
        option: (state) =>
          cn(
            "!relative !flex !w-full !select-none !items-center !rounded-sm !py-2.5 !pl-8 !pr-2 !text-base !outline-none",
            "!cursor-pointer",
            state.isFocused && "!bg-accent !text-accent-foreground",
            state.isSelected && "!bg-accent !text-accent-foreground !font-medium"
          ),
        multiValue: () => "!bg-transparent !gap-1.5 !my-0.5",
        multiValueLabel: () => "!p-0",
        multiValueRemove: () => "!hidden",
        valueContainer: () => "!gap-1.5 !p-2 !flex !flex-wrap",
        clearIndicator: () => "!hidden",
      }}
      components={{
        MultiValue,
        IndicatorSeparator: () => null,
        Option: ({ children, ...props }) => (
          <components.Option {...props}>
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              {props.isSelected && <Check className="h-4 w-4" />}
            </span>
            {children}
          </components.Option>
        ),
      }}
      styles={{
        control: (base) => ({
          ...base,
          cursor: "pointer",
          border: "1px solid hsl(var(--input))",
          boxShadow: "none",
          minHeight: "48px",
        }),
        valueContainer: (base) => ({
          ...base,
          gap: "6px",
          padding: "8px",
          flexWrap: "wrap",
          height: "auto",
        }),
        option: (base) => ({
          ...base,
          cursor: "pointer",
        }),
      }}
    />
  )
} 