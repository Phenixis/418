"use client"

import CheckIcon from "@mui/icons-material/Check"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { StatutEtudiant } from "@/components/cours/course.types"
import { StudentWithStatus } from "@/lib/actions/cours-actuel"

interface EtudiantRowProps {
    etudiant: StudentWithStatus
    onClick?: (student: StudentWithStatus) => void
    isDisabled?: boolean
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
    const isPresent = statut === StatutEtudiant.PRESENT

    return (
        <button
            type="button"
            disabled={isDisabled}
            onClick={() => onClick?.(etudiant)}
            className={cn(
                "flex w-full items-center gap-4 rounded-lg border border-faded bg-white px-4 py-2 text-left transition-colors",
                isPresent && "border-green bg-green/10",
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

            {/* Espacement automatique + indicateur de présence */}
            <div className="ml-auto shrink-0">
                {isPresent && (
                    <CheckIcon className="text-green" style={{ fontSize: "1.25rem" }} />
                )}
            </div>
        </button>
    )
}
