"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { Label } from "./label";

interface DateTimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
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
    value,
    onChange,
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
        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0);

        if (effectiveMinDate) {
            const min = new Date(effectiveMinDate);
            min.setHours(0, 0, 0, 0);
            if (selectedDate < min) {
                onChange(min);
                return;
            }
        }

        if (effectiveMaxDate) {
            const max = new Date(effectiveMaxDate);
            max.setHours(0, 0, 0, 0);
            if (selectedDate > max) {
                onChange(max);
                return;
            }
        }
    }, [value, effectiveMinDate, effectiveMaxDate, onChange]);

    // Validate and adjust time if it's outside the allowed range
    useEffect(() => {
        const timeString = value.toTimeString().slice(0, 5); // "HH:mm"

        if (minTime && timeString < minTime) {
            const newDate = new Date(value);
            const [hours, minutes] = minTime.split(':').map(Number);
            newDate.setHours(hours, minutes, 0);
            onChange(newDate);
            return;
        }

        if (maxTime && timeString > maxTime) {
            const newDate = new Date(value);
            const [hours, minutes] = maxTime.split(':').map(Number);
            newDate.setHours(hours, minutes, 0);
            onChange(newDate);
            return;
        }
    }, [value, minTime, maxTime, onChange]);

    return (
        <div className="flex gap-2">
            <input type="hidden" id={id} name={id} value={value.toISOString().slice(0, 19)} />
            <div className="flex-1 flex flex-col gap-1">
                {
                    dateLabel.length > 0 && <Label className="">{dateLabel}</Label>
                }
                <DatePicker
                    value={value}
                    onChange={onChange}
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
                    value={value.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                        const newDate = new Date(value);
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        newDate.setHours(hours, minutes, 0);
                        onChange(newDate);
                    }}
                    min={minTime}
                    max={maxTime}
                    className="h-9 w-fit appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </div>
        </div>
    );
}
