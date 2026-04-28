"use client";

import { useEffect, useRef, useState } from "react";
import { AttendanceRealtimeEvent } from "@/lib/realtime/attendance-events";
import {
    RealtimeConnectionState,
    subscribeToAttendanceUpdates
} from "@/lib/realtime/provider-client";

export interface UseAttendanceRealtimeOptions {
    sessionId: string;
    pendingStudentMails: Set<string>;
    onAttendanceEvent: (event: AttendanceRealtimeEvent) => void;
}

/**
 * Subscribes to live attendance updates for a session and deduplicates events.
 *
 * Wraps {@link subscribeToAttendanceUpdates} with React lifecycle management.
 * Events whose `eventId` has already been processed are silently dropped to
 * handle Pusher's at-least-once delivery guarantee. Events for students in
 * `pendingStudentMails` are also suppressed (optimistic update already applied).
 * The deduplication set is cleared automatically when it exceeds 500 entries.
 *
 * @param options.sessionId - UUID of the session to subscribe to.
 * @param options.pendingStudentMails - Mails of students with in-flight optimistic updates.
 * @param options.onAttendanceEvent - Callback invoked for each new, validated event.
 * @returns `{ connectionState }` — the current {@link RealtimeConnectionState}.
 */
export function useAttendanceRealtime(options: Readonly<UseAttendanceRealtimeOptions>) {
    const [connectionState, setConnectionState] = useState<RealtimeConnectionState>("connecting");
    const handledEventIdsRef = useRef<Set<string>>(new Set());
    const pendingStudentMailsRef = useRef(options.pendingStudentMails);
    const onAttendanceEventRef = useRef(options.onAttendanceEvent);

    useEffect(() => {
        pendingStudentMailsRef.current = options.pendingStudentMails;
    }, [options.pendingStudentMails]);

    useEffect(() => {
        onAttendanceEventRef.current = options.onAttendanceEvent;
    }, [options.onAttendanceEvent]);

    useEffect(() => {
        return subscribeToAttendanceUpdates({
            sessionId: options.sessionId,
            onConnectionStateChange: setConnectionState,
            onAttendanceEvent: (event) => {
                if (handledEventIdsRef.current.has(event.eventId)) {
                    return;
                }

                handledEventIdsRef.current.add(event.eventId);
                if (handledEventIdsRef.current.size > 500) {
                    handledEventIdsRef.current.clear();
                }

                if (pendingStudentMailsRef.current.has(event.studentMail)) {
                    return;
                }

                onAttendanceEventRef.current(event);
            }
        });
    }, [options.sessionId]);

    return { connectionState };
}
