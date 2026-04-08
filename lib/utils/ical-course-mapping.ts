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
    "R3.10 Management des SI Atelier AGILE",
    "R3.10 Management des SI",
    "R5.01 Management",
    "SAé3.C.01-R3.10 Management SI",
    "SAé3.A.01 Lancement",
    "SAé3.A.01 Gestion de Projet",
    "SAé3.A.01 Review",
    "SAé3.A.01 Retro",
    "R2.10 Gestion proj.",
    "Accueil INFO",
    "R3.03 Analyse",
    "R3.14 PPP",
    "R4.07 PPP",
    "R5.03 Politique de com. Soutenance",
    "R5.03 Politique de com.",
    "R5.C.02 PPP",
    "R6.C.04 PPP",
    "SAé3.A.01 Conception BdD",
    "SAé3.C.01 Conception BdD",
    "SAé3.C.01 Gestion de Projet",
    "SAé3.C.01 Retro",
    "SAé3.C.01 Review",
    "SAé3.C.01 TD Noté",
    "SAé4.A.01 Gestion de projet",
    "SAé4.A.01 Rétro",
    "SAé4.A.01 Review",
    "SAé4.A/C.01 Lancement",
    "SAé3.A/C.01 Lancement",
    "SAé4.C.01 Gestion de projet",
    "SAé4.C.01 Rétro",
    "SAé4.C.01 Review",
    "SAé6.C.01-R6.03 Com",
    "R5.A.05 - Programmation avancée",
    "PPP Alternance",
    "Présentation consignes Rapport",
    "Présentation de l'alternance",
].sort((firstCourse, secondCourse) => secondCourse.length - firstCourse.length);

export interface CourseMappingResult {
    courseName: string;
    sessionName: string;
}

/**
 * Tente de faire correspondre un SUMMARY ADE à un cours connu.
 * Retourne null si aucune correspondance n'est trouvée (événement à ignorer).
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
