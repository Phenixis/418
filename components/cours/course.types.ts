/** Lifecycle status of a course session relative to the current time. */
export enum CourseStatus {
    /** The session is currently in progress. */
    EN_COURS = "en-cours",
    /** The session has ended. */
    TERMINE = "termine",
    /** The session has not started yet. */
    A_VENIR = "a-venir",
}

/**
 * Attendance status of a student for a given session.
 *
 * Used throughout the roll-call UI and stored as `lateStatus` in the database
 * via `statutVersLateStatus` / `lateStatusVersStatut` in `course-utils.ts`.
 */
export enum StatutEtudiant {
    /** Student has not been scanned yet (default). */
    "NON-SCANNE" = "non-scanne",
    /** Student scanned more than 5 minutes after the session start. */
    "RETARD+5" = "retard+5",
    /** Student scanned more than 10 minutes after the session start. */
    "RETARD+10" = "retard+10",
    /** Student scanned more than 15 minutes after the session start. */
    "RETARD+15" = "retard+15",
    /** Student is present and on time. */
    PRESENT = "present",
    /** Student is marked absent. */
    ABSENT = "absent",
}
