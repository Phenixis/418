export type AttendanceRealtimeStatus = "present" | "non-scanne";

export type AttendanceRealtimeSource = "teacher-toggle" | "student-scan";

export interface AttendanceRealtimeEvent {
    eventId: string;
    sessionId: string;
    studentMail: string;
    status: AttendanceRealtimeStatus;
    /** Niveau de retard (0 = présent, 1 = +5, 2 = +10, 3 = +15). Absent ou 0 si présent sans retard. */
    lateStatus?: number;
    source: AttendanceRealtimeSource;
    occurredAt: string;
}

export const ATTENDANCE_REALTIME_EVENT_NAME = "attendance-updated";

export function buildAttendanceChannelName(sessionId: string): string {
    return `private-session-attendance-${sessionId}`;
}

export function isAttendanceRealtimeEvent(payload: unknown): payload is AttendanceRealtimeEvent {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }

    const candidateEvent = payload as Partial<AttendanceRealtimeEvent>;

    return (
        typeof candidateEvent.eventId === "string"
        && typeof candidateEvent.sessionId === "string"
        && typeof candidateEvent.studentMail === "string"
        && (candidateEvent.status === "present" || candidateEvent.status === "non-scanne")
        && (candidateEvent.source === "teacher-toggle" || candidateEvent.source === "student-scan")
        && typeof candidateEvent.occurredAt === "string"
        && (candidateEvent.lateStatus === undefined || typeof candidateEvent.lateStatus === "number")
    );
}
