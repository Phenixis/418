"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { Label } from "./label";

interface DateTimePickerProps {
    date: Date;
    onDateChange: (date: Date) => void;
    dateLabel?: string;
    timeLabel?: string;
    minDate?: Date;
    maxDate?: Date;
    minTime?: string;
    maxTime?: string;
    id?: string;
    step?: number;
}

export function DateTimePicker({
    date,
    onDateChange,
    dateLabel = "Date",
    timeLabel = "Time",
    minDate,
    maxDate,
    minTime,
    maxTime,
    id,
    step = 1
}: Readonly<DateTimePickerProps>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate effective min/max dates
    const effectiveMinDate = minDate ?? today;
    const effectiveMaxDate = maxDate ?? today;

    // Validate and adjust date if it's outside the allowed range
    useEffect(() => {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        if (effectiveMinDate) {
            const min = new Date(effectiveMinDate);
            min.setHours(0, 0, 0, 0);
            if (selectedDate < min) {
                onDateChange(min);
                return;
            }
        }

        if (effectiveMaxDate) {
            const max = new Date(effectiveMaxDate);
            max.setHours(0, 0, 0, 0);
            if (selectedDate > max) {
                onDateChange(max);
                return;
            }
        }
    }, [date, effectiveMinDate, effectiveMaxDate, onDateChange]);

    // Validate and adjust time if it's outside the allowed range
    useEffect(() => {
        const timeString = date.toTimeString().slice(0, 5); // "HH:mm"

        if (minTime && timeString < minTime) {
            const newDate = new Date(date);
            const [hours, minutes] = minTime.split(':').map(Number);
            newDate.setHours(hours, minutes, 0);
            onDateChange(newDate);
            return;
        }

        if (maxTime && timeString > maxTime) {
            const newDate = new Date(date);
            const [hours, minutes] = maxTime.split(':').map(Number);
            newDate.setHours(hours, minutes, 0);
            onDateChange(newDate);
            return;
        }
    }, [date, minTime, maxTime, onDateChange]);

    return (
        <div className="flex gap-2">
            <input type="hidden" id={id} name={id} value={date.toISOString().slice(0, 19)} />
            <div className="flex-1 flex flex-col gap-1">
                {
                    dateLabel.length > 0 && <Label className="">{dateLabel}</Label>
                }
                <DatePicker
                    value={date}
                    onChange={onDateChange}
                    minDate={effectiveMinDate}
                    maxDate={effectiveMaxDate}
                />
            </div>
            <div className="flex flex-col gap-1">
                {
                    timeLabel.length > 0 && <Label className="">{timeLabel}</Label>
                }
                <Input
                    type="time"
                    step={step}
                    value={date.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                        const newDate = new Date(date);
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        newDate.setHours(hours, minutes, 0);
                        onDateChange(newDate);
                    }}
                    min={minTime}
                    max={maxTime}
                    className="h-9 w-fit appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </div>
        </div>
    );
}
