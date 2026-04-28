/**
 * Liste des cours connus, à compléter au fur et à mesure.
 * Les noms doivent correspondre exactement au préfixe des SUMMARY ADE.
 * Triés par longueur décroissante pour que le match le plus précis soit
 * appliqué en premier (ex: "R3.10 Management des SI Atelier AGILE" avant
 * "R3.10 Management des SI").
 */
const KNOWN_COURSES = [
    "R4.A.09 Management",
    "SAé3.A.01-R3.10 Management SI",
    "R3.10 Management des SI",
    "R5.01 Management",
    "SAé3.C.01-R3.10 Management SI",
    "R2.10 Gestion proj.",
    "Accueil INFO",
    "R3.03 Analyse",
    "R3.14 PPP",
    "R4.07 PPP",
    "R5.03 Politique de com.",
    "R5.C.02 PPP",
    "R6.C.04 PPP",
    "SAé3.A.01",
    "SAé3.C.01",
    "SAé4.A/C.01 Lancement",
    "SAé3.A/C.01 Lancement",
    "SAé4.A.01",
    "SAé4.C.01",
    "SAé6.C.01-R6.03 Com",
    "R5.A.05 - Programmation avancée",
    "PPP Alternance",
    "Présentation consignes Rapport",
    "Présentation de l'alternance",
].sort((firstCourse, secondCourse) => secondCourse.length - firstCourse.length);

/**
 * Database-level group coordinates extracted from an ADE group code.
 *
 * Produced by {@link parseGroupCode}.
 */
export interface ParsedGroup {
    /** Year of study (e.g. `"2"`). */
    promo: string;
    /** TD group letter (e.g. `"A"`, `"D"`). */
    td: string;
    /** TP subgroup digit (e.g. `"1"`, `"2"`). */
    tp: string;
}

/**
 * Parses an ADE group code into one or two {@link ParsedGroup} records.
 *
 * A code like `"2D2"` maps to a single TP group `{ promo: "2", td: "D", tp: "2" }`.
 * A code like `"2A"` (no TP digit) expands to both `tp: "1"` and `tp: "2"`,
 * representing a full TD session that covers both subgroups.
 *
 * @param code - ADE group code to parse (e.g. `"2D2"`, `"2A"`).
 * @returns An array of parsed group coordinates, or an empty array if the code
 *   does not match the expected pattern.
 */
export function parseGroupCode(code: string): ParsedGroup[] {
    const match = code.match(/^(\d)([A-Za-z])(\d)?$/);

    if (!match) {
        return [];
    }

    const promo = match[1];
    const td = match[2].toUpperCase();
    const tp = match[3];

    if (tp) {
        return [{ promo, td, tp }];
    }

    return [
        { promo, td, tp: '1' },
        { promo, td, tp: '2' },
    ];
}

/**
 * Successful match between an ADE SUMMARY string and a known course.
 *
 * Produced by {@link mapSummaryToCourse}.
 */
export interface CourseMappingResult {
    /** Canonical course name as it appears in the known-courses list. */
    courseName: string;
    /** Remainder of the SUMMARY after the course prefix (used as the session label). */
    sessionName: string;
}

/**
 * Matches an ADE SUMMARY string against the list of known courses.
 *
 * Courses are tried longest-first so that more specific names (e.g.
 * `"R3.10 Management des SI Atelier AGILE"`) take precedence over shorter
 * prefixes (`"R3.10 Management des SI"`). The comparison is case-insensitive.
 *
 * @param summary - Raw SUMMARY from the iCal event.
 * @returns A {@link CourseMappingResult} when a match is found, or `null` when
 *   the event should be skipped (unknown course).
 */
export function mapSummaryToCourse(summary: string): CourseMappingResult | null {
    const lowerSummary = summary.toLowerCase();

    for (const course of KNOWN_COURSES) {
        if (lowerSummary.startsWith(course.toLowerCase())) {
            const sessionName = summary.slice(course.length).trim();
            return {
                courseName: course,
                sessionName: sessionName.length > 0 ? sessionName : course,
            };
        }
    }

    return null;
}
