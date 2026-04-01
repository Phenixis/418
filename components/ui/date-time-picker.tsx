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
    const roundMinutesToQuarterHour = (minutes: number): number => {
        const validMinutes = [0, 15, 30, 45];
        const closest = validMinutes.reduce((prev, curr) =>
            Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev
        );
        return closest;
    };

    const formatLocalDateTime = (dateValue: Date) => {
        const year = dateValue.getFullYear();
        const month = `${dateValue.getMonth() + 1}`.padStart(2, "0");
        const day = `${dateValue.getDate()}`.padStart(2, "0");
        const hours = `${dateValue.getHours()}`.padStart(2, "0");
        const minutes = `${dateValue.getMinutes()}`.padStart(2, "0");
        const seconds = `${dateValue.getSeconds()}`.padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Apply default lower bound only; no implicit upper bound.
    const effectiveMinDate = minDate ?? today;
    const effectiveMaxDate = maxDate;

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
        }
    }, [value, minTime, maxTime, onChange]);

    return (
        <div className="flex justify-start gap-2">
            <input type="hidden" id={id} name={id} value={formatLocalDateTime(value)} />
            <div className="flex flex-col gap-2">
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
            <div className="flex flex-col gap-2">
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
                        const adjustedMinutes = roundMinutesToQuarterHour(minutes);
                        newDate.setHours(hours, adjustedMinutes, 0);
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
