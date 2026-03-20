"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo } from "react";

interface DateTimePickerProps {
    date: Date;
    time: string;
    onDateChange: (date: Date) => void;
    onTimeChange: (time: string) => void;
    dateLabel?: string;
    timeLabel?: string;
    minDate?: Date;
    maxDate?: Date;
    minTime?: string;
    maxTime?: string;
    disableFuture?: boolean;
    disablePast?: boolean;
}

export function DateTimePicker({
    date,
    time,
    onDateChange,
    onTimeChange,
    dateLabel = "Date",
    timeLabel = "Time",
    minDate,
    maxDate,
    minTime,
    maxTime,
    disableFuture = false,
    disablePast = false,
}: Readonly<DateTimePickerProps>) {
    const now = useMemo(() => new Date(), []);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate effective min/max dates
    const effectiveMinDate = disablePast && !minDate ? today : minDate;
    const effectiveMaxDate = disableFuture && !maxDate ? today : maxDate;

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
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Only apply time restrictions if the selected date is today
        const isToday = selectedDate.getTime() === today.getTime();
        
        if (isToday && disableFuture) {
            const currentTime = now.toTimeString().slice(0, 8);
            if (time > currentTime) {
                onTimeChange(currentTime);
                return;
            }
        }
        
        if (minTime && time < minTime) {
            onTimeChange(minTime);
            return;
        }
        
        if (maxTime && time > maxTime) {
            onTimeChange(maxTime);
            return;
        }
    }, [time, date, minTime, maxTime, disableFuture, now, onTimeChange]);

    // Calculate effective min/max time for the time input
    const getEffectiveMinTime = () => {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (disablePast && selectedDate.getTime() === today.getTime()) {
            const currentTime = now.toTimeString().slice(0, 8);
            return minTime && minTime > currentTime ? minTime : currentTime;
        }
        
        return minTime;
    };

    const getEffectiveMaxTime = () => {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (disableFuture && selectedDate.getTime() === today.getTime()) {
            const currentTime = now.toTimeString().slice(0, 8);
            return maxTime && maxTime < currentTime ? maxTime : currentTime;
        }
        
        return maxTime;
    };

    return (
        <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">{dateLabel}</label>
                <DatePicker 
                    value={date} 
                    onChange={onDateChange}
                    minDate={effectiveMinDate}
                    maxDate={effectiveMaxDate}
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">{timeLabel}</label>
                <Input
                    type="time"
                    step="1"
                    value={time}
                    onChange={(e) => onTimeChange(e.target.value)}
                    min={getEffectiveMinTime()}
                    max={getEffectiveMaxTime()}
                    className="w-30 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </div>
        </div>
    );
}
