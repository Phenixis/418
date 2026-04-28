import { StatutEtudiant } from "@/components/cours/course.types";

// Ordre du cycle de statut au clic sur une carte étudiant
const CYCLE_STATUTS: StatutEtudiant[] = [
    StatutEtudiant["NON-SCANNE"],
    StatutEtudiant.PRESENT,
    StatutEtudiant["RETARD+5"],
    StatutEtudiant["RETARD+10"],
    StatutEtudiant["RETARD+15"],
];

/**
 * Returns the next status in the manual roll-call cycle.
 *
 * The cycle is: `NON-SCANNE` → `PRESENT` → `RETARD+5` → `RETARD+10` →
 * `RETARD+15` → `NON-SCANNE`. Statuses outside the cycle (e.g. `ABSENT`)
 * reset to `NON-SCANNE`.
 *
 * @param statutActuel - The student's current {@link StatutEtudiant}.
 * @returns The next status to apply on click.
 */
export function getProchainStatut(statutActuel: StatutEtudiant): StatutEtudiant {
    const indexActuel = CYCLE_STATUTS.indexOf(statutActuel);
    if (indexActuel === -1) return StatutEtudiant["NON-SCANNE"];
    return CYCLE_STATUTS[(indexActuel + 1) % CYCLE_STATUTS.length];
}

/**
 * Returns `true` when the status indicates the student is present, including late arrivals.
 *
 * @param statut - The student's {@link StatutEtudiant} to test.
 * @returns `true` for `PRESENT`, `RETARD+5`, `RETARD+10`, and `RETARD+15`.
 */
export function isEtudiantPresent(statut: StatutEtudiant): boolean {
    return statut === StatutEtudiant.PRESENT
        || statut === StatutEtudiant["RETARD+5"]
        || statut === StatutEtudiant["RETARD+10"]
        || statut === StatutEtudiant["RETARD+15"];
}

/**
 * Converts a numeric `late_status` database value to a {@link StatutEtudiant}.
 *
 * The mapping is: 1 → `RETARD+5`, 2 → `RETARD+10`, 3 → `RETARD+15`,
 * anything else → `PRESENT`.
 *
 * @param lateStatus - The `late_status` integer from the attendance table.
 * @returns The corresponding {@link StatutEtudiant}.
 */
export function lateStatusVersStatut(lateStatus: number): StatutEtudiant {
    switch (lateStatus) {
        case 1: return StatutEtudiant["RETARD+5"];
        case 2: return StatutEtudiant["RETARD+10"];
        case 3: return StatutEtudiant["RETARD+15"];
        default: return StatutEtudiant.PRESENT;
    }
}

/**
 * Converts a {@link StatutEtudiant} to the numeric `late_status` value stored in the database.
 *
 * The mapping is: `RETARD+5` → 1, `RETARD+10` → 2, `RETARD+15` → 3,
 * any other status → 0.
 *
 * @param statut - The {@link StatutEtudiant} to convert.
 * @returns The integer `late_status` value for the attendance table.
 */
export function statutVersLateStatus(statut: StatutEtudiant): number {
    switch (statut) {
        case StatutEtudiant["RETARD+5"]: return 1;
        case StatutEtudiant["RETARD+10"]: return 2;
        case StatutEtudiant["RETARD+15"]: return 3;
        default: return 0;
    }
}
