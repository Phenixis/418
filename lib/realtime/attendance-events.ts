export type AttendanceRealtimeStatus = "present" | "non-scanne";

export type AttendanceRealtimeSource = "teacher-toggle" | "student-scan";

export interface AttendanceRealtimeEvent {
    eventId: string;
    courseId: string;
    studentMail: string;
    status: AttendanceRealtimeStatus;
    source: AttendanceRealtimeSource;
    occurredAt: string;
}

export const ATTENDANCE_REALTIME_EVENT_NAME = "attendance-updated";

export function buildAttendanceChannelName(courseId: string): string {
    return `private-course-attendance-${courseId}`;
}

export function isAttendanceRealtimeEvent(payload: unknown): payload is AttendanceRealtimeEvent {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }

    const candidateEvent = payload as Partial<AttendanceRealtimeEvent>;

    return (
        typeof candidateEvent.eventId === "string"
        && typeof candidateEvent.courseId === "string"
        && typeof candidateEvent.studentMail === "string"
        && (candidateEvent.status === "present" || candidateEvent.status === "non-scanne")
        && (candidateEvent.source === "teacher-toggle" || candidateEvent.source === "student-scan")
        && typeof candidateEvent.occurredAt === "string"
    );
}
