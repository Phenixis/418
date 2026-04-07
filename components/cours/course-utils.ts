import { StatutEtudiant } from "@/components/cours/course.types";

// Ordre du cycle de statut au clic sur une carte étudiant
const CYCLE_STATUTS: StatutEtudiant[] = [
    StatutEtudiant["NON-SCANNE"],
    StatutEtudiant.PRESENT,
    StatutEtudiant["RETARD+5"],
    StatutEtudiant["RETARD+10"],
    StatutEtudiant["RETARD+15"],
];

/** Retourne le prochain statut dans le cycle */
export function getProchainStatut(statutActuel: StatutEtudiant): StatutEtudiant {
    const indexActuel = CYCLE_STATUTS.indexOf(statutActuel);
    if (indexActuel === -1) return StatutEtudiant["NON-SCANNE"];
    return CYCLE_STATUTS[(indexActuel + 1) % CYCLE_STATUTS.length];
}

/** Vérifie si un statut indique que l'étudiant est présent (y compris en retard) */
export function isEtudiantPresent(statut: StatutEtudiant): boolean {
    return statut === StatutEtudiant.PRESENT
        || statut === StatutEtudiant["RETARD+5"]
        || statut === StatutEtudiant["RETARD+10"]
        || statut === StatutEtudiant["RETARD+15"];
}

/** Convertit une valeur late_status (BDD) en StatutEtudiant */
export function lateStatusVersStatut(lateStatus: number): StatutEtudiant {
    switch (lateStatus) {
        case 1: return StatutEtudiant["RETARD+5"];
        case 2: return StatutEtudiant["RETARD+10"];
        case 3: return StatutEtudiant["RETARD+15"];
        default: return StatutEtudiant.PRESENT;
    }
}

/** Convertit un StatutEtudiant en valeur late_status pour la BDD */
export function statutVersLateStatus(statut: StatutEtudiant): number {
    switch (statut) {
        case StatutEtudiant["RETARD+5"]: return 1;
        case StatutEtudiant["RETARD+10"]: return 2;
        case StatutEtudiant["RETARD+15"]: return 3;
        default: return 0;
    }
}
