// src/components/ui/date-picker.tsx
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  value?: string // YYYY-MM-DD format
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  ariaLabel?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  id,
  ariaLabel,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? new Date(value) : undefined

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Format as YYYY-MM-DD
      const formatted = format(selectedDate, "yyyy-MM-dd")
      onChange(formatted)
      setOpen(false)
    } else {
      onChange("")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 md:h-10 text-base md:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600",
            !date && "text-muted-foreground",
            className
          )}
          aria-label={ariaLabel || placeholder}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" align="start">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className="p-3"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium text-gray-900 dark:text-gray-100",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-700 dark:text-gray-300"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-gray-500 dark:text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-purple-100 dark:[&:has([aria-selected])]:bg-purple-900/30 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md"
            ),
            day_selected: "bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-600 dark:hover:bg-purple-500 focus:bg-purple-600 dark:focus:bg-purple-500",
            day_today: "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-semibold",
            day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
            day_disabled: "text-gray-300 dark:text-gray-700 opacity-50",
            day_range_middle: "aria-selected:bg-purple-100 dark:aria-selected:bg-purple-900/30 aria-selected:text-gray-900 dark:aria-selected:text-gray-100",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

