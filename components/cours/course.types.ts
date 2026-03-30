// Statuts possibles d'un cours
export enum CourseStatus {
    EN_COURS = "en-cours",
    TERMINE = "termine",
    A_VENIR = "a-venir",
}

// Statuts possibles d'un étudiant pour un cours donné
export enum StatutEtudiant {
    "NON-SCANNE" = "non-scanne",
    "RETARD+5" = "retard+5",
    "RETARD+10" = "retard+10",
    "RETARD+15" = "retard+15",
    PRESENT = "present",
    ABSENT = "absent",
}
