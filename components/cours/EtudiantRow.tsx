"use client"

import CheckIcon from "@mui/icons-material/Check"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { StatutEtudiant } from "@/components/cours/course.types"
import { isEtudiantPresent } from "@/components/cours/course-utils"
import { StudentWithStatus } from "@/lib/actions/cours-actuel"

interface EtudiantRowProps {
    etudiant: StudentWithStatus
    onClick?: (student: StudentWithStatus) => void
    isDisabled?: boolean
}

/** Couleurs de bordure et fond selon le statut */
const STYLES_ROW: Record<string, string> = {
    [StatutEtudiant.PRESENT]: "border-green bg-green/10",
    [StatutEtudiant["RETARD+5"]]: "border-yellow-400 bg-yellow-400/10",
    [StatutEtudiant["RETARD+10"]]: "border-orange bg-orange/10",
    [StatutEtudiant["RETARD+15"]]: "border-red bg-red/10",
}

/** Couleurs de l'icône selon le statut */
const COULEURS_ICONE: Record<string, string> = {
    [StatutEtudiant.PRESENT]: "text-green",
    [StatutEtudiant["RETARD+5"]]: "text-yellow-600",
    [StatutEtudiant["RETARD+10"]]: "text-orange",
    [StatutEtudiant["RETARD+15"]]: "text-red",
}



// Photo miniature de l'étudiant, ou silhouette générique
function PhotoMiniature({ photoUrl, prenom, nom }: Readonly<{ photoUrl: string | null; prenom: string; nom: string }>) {
    if (!photoUrl) {
        return (
            <div className="size-10 shrink-0 rounded-full bg-faded/20 flex items-center justify-center">
                <Image
                    src="/icons/silhouette.svg"
                    alt="Photo non disponible"
                    width={24}
                    height={24}
                    className="opacity-40"
                />
            </div>
        )
    }

    return (
        <div className="size-10 shrink-0 relative rounded-full overflow-hidden">
            <Image
                src={photoUrl}
                alt={`Photo de ${prenom} ${nom}`}
                fill
                className="object-cover object-top"
            />
        </div>
    )
}

export default function EtudiantRow({
    etudiant,
    onClick,
    isDisabled = false,
}: Readonly<EtudiantRowProps>) {
    const { firstName, lastName, picture, statut, groupName } = etudiant
    const isPresent = isEtudiantPresent(statut)
    const rowStyle = STYLES_ROW[statut] ?? ""
    const iconeCouleur = COULEURS_ICONE[statut] ?? ""
    const isEnRetard = statut === StatutEtudiant["RETARD+5"]
        || statut === StatutEtudiant["RETARD+10"]
        || statut === StatutEtudiant["RETARD+15"]

    return (
        <button
            type="button"
            disabled={isDisabled}
            onClick={() => onClick?.(etudiant)}
            className={cn(
                "flex w-full items-center gap-4 rounded-lg border border-faded bg-white px-4 py-2 text-left transition-colors",
                rowStyle,
                isDisabled && "opacity-70 cursor-not-allowed",
                onClick && !isDisabled && "cursor-pointer hover:bg-black/5 active:bg-black/10"
            )}
        >
            {/* Photo miniature */}
            <PhotoMiniature photoUrl={picture} prenom={firstName} nom={lastName} />

            {/* Prénom et nom */}
            <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{firstName}</span>
                <span className="truncate uppercase font-medium">{lastName}</span>
            </div>

            {/* Groupe */}
            <span className="text-xs text-faded ml-1">{groupName}</span>

            {/* Espacement automatique + indicateur de statut */}
            <div className="ml-auto shrink-0 flex items-center gap-1">
                {isPresent && !isEnRetard && (
                    <CheckIcon className={iconeCouleur} style={{ fontSize: "1.25rem" }} />
                )}
                {isEnRetard && (
                    <AccessTimeIcon className={iconeCouleur} style={{ fontSize: "1.25rem" }} />
                )}
            </div>
        </button>
    )
}
