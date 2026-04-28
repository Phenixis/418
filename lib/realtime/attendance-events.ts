/** Attendance status carried by a realtime event. */
export type AttendanceRealtimeStatus = "present" | "non-scanne";

/** Origin of an attendance change event. */
export type AttendanceRealtimeSource = "teacher-toggle" | "student-scan";

/**
 * Payload broadcast over Pusher when a student's attendance status changes.
 *
 * Emitted by the server via `publishAttendanceRealtimeEvent` and received
 * by clients subscribed through `subscribeToAttendanceUpdates`.
 */
export interface AttendanceRealtimeEvent {
    /** Unique identifier for this event, used for client-side deduplication. */
    eventId: string;
    /** UUID of the session this event belongs to. */
    sessionId: string;
    /** Email of the student whose status changed. */
    studentMail: string;
    /** New attendance status. */
    status: AttendanceRealtimeStatus;
    /**
     * Lateness level: 0 = on time, 1 = +5 min, 2 = +10 min, 3 = +15 min.
     * Absent or 0 when the student is present without lateness.
     */
    lateStatus?: number;
    /** How the status change was triggered. */
    source: AttendanceRealtimeSource;
    /** ISO 8601 timestamp of when the event occurred on the server. */
    occurredAt: string;
}

/** Pusher event name used for all attendance updates. */
export const ATTENDANCE_REALTIME_EVENT_NAME = "attendance-updated";

/**
 * Returns the Pusher private channel name for a given session.
 *
 * @param sessionId - UUID of the session.
 * @returns The private channel name to subscribe to or publish on.
 */
export function buildAttendanceChannelName(sessionId: string): string {
    return `private-session-attendance-${sessionId}`;
}

/**
 * Type guard that validates an unknown payload as an {@link AttendanceRealtimeEvent}.
 *
 * Used on the client side to safely narrow raw Pusher payloads before processing.
 *
 * @param payload - The raw value received from Pusher.
 * @returns `true` when all required fields are present and correctly typed.
 */
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
