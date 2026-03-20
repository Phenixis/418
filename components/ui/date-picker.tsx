"use client"

import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Calendar} from "@/components/ui/calendar"
import Minus from "@mui/icons-material/Remove"
import Plus from "@mui/icons-material/Add"
import {format} from "date-fns"
import {useState} from "react"

export function DatePicker(
    {
        value,
        onChange,
        minDate,
        maxDate,
        id
    }: Readonly<{
        value: Date
        onChange: (date: Date) => void
        minDate?: Date
        maxDate?: Date,
        id?: string
    }>
) {
    const [showCalendar, setShowCalendar] = useState(false)

    const handleDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            onChange(newDate)
            setShowCalendar(false)
        }
    }

    return (
        <div className="flex gap-1 items-center">
            <input type="hidden" id={id} name={id} value={format(value, "yyyy-MM-dd")} />
            <Button
                type="button"
                variant="outline"
                className="hidden bg-transparent md:block px-2"
                onClick={() => {
                    const newDate = new Date(value.getTime() - 24 * 60 * 60 * 1000)
                    if (minDate) {
                        const min = new Date(minDate)
                        min.setHours(0, 0, 0, 0)
                        if (newDate >= min) {
                            onChange(newDate)
                        } else {
                            onChange(min)
                        }
                    } else {
                        onChange(newDate)
                    }
                }}
            >
                <Minus className="!size-5"/>
            </Button>

            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent"
                    >
                        {format(value, "dd/MM/yyyy")}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start" side="bottom">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateChange}
                        disabled={(date) => {
                            if (minDate) {
                                const min = new Date(minDate)
                                min.setHours(0, 0, 0, 0)
                                if (date < min) return true
                            }
                            if (maxDate) {
                                const max = new Date(maxDate)
                                max.setHours(0, 0, 0, 0)
                                if (date > max) return true
                            }
                            return false
                        }}
                    />
                </PopoverContent>
            </Popover>

            <Button
                type="button"
                variant="outline"
                className="hidden bg-transparent md:block px-2"
                onClick={() => {
                    const nextDate = new Date(value.getTime() + 24 * 60 * 60 * 1000)
                    if (maxDate) {
                        const max = new Date(maxDate)
                        max.setHours(0, 0, 0, 0)
                        if (nextDate <= max) {
                            onChange(nextDate)
                        } else {
                            onChange(max)
                        }
                    } else {
                        onChange(nextDate)
                    }
                }}
            >
                <Plus className="!size-5"/>
            </Button>
        </div>
    )
}
