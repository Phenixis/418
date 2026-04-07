"use client";

import { useEffect, useRef, useState } from "react";
import { AttendanceRealtimeEvent } from "@/lib/realtime/attendance-events";
import {
    RealtimeConnectionState,
    subscribeToAttendanceUpdates
} from "@/lib/realtime/provider-client";

interface UseAttendanceRealtimeOptions {
    sessionId: string;
    pendingStudentMails: Set<string>;
    onAttendanceEvent: (event: AttendanceRealtimeEvent) => void;
}

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
