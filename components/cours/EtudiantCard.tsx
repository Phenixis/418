"use client"

import CheckIcon from "@mui/icons-material/Check"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getStudentPictureSrc } from "@/lib/utils/student-picture"
import { StatutEtudiant } from "@/components/cours/course.types"
import { isEtudiantPresent } from "@/components/cours/course-utils"
import { StudentWithStatus } from "@/lib/actions/cours-actuel"

interface EtudiantCardProps {
    etudiant: StudentWithStatus
    onClick?: (student: StudentWithStatus) => void
    isDisabled?: boolean
    isEditable?: boolean
}

function isValidPhotoSource(photoUrl: string | null): photoUrl is string {
    if (!photoUrl) {
        return false
    }

    const normalizedPhotoUrl = photoUrl.trim()
    if (normalizedPhotoUrl.length === 0) {
        return false
    }

    if (normalizedPhotoUrl.startsWith("/") || normalizedPhotoUrl.startsWith("data:image/")) {
        return true
    }

    try {
        const parsedUrl = new URL(normalizedPhotoUrl)
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
    }
    catch {
        return false
    }
}

/** Configuration visuelle de la zone nom selon le statut */
const STYLES_ZONE_NOM: Record<string, string> = {
    [StatutEtudiant.PRESENT]: "bg-green border-green",
    [StatutEtudiant["RETARD+5"]]: "bg-yellow-400 border-yellow-400",
    [StatutEtudiant["RETARD+10"]]: "bg-orange border-orange",
    [StatutEtudiant["RETARD+15"]]: "bg-red border-red",
}



// Affiche la photo carrée de l'étudiant, ou une silhouette générique si indisponible
function PhotoEtudiant({ photoUrl, prenom, nom }: Readonly<{ photoUrl: string | null; prenom: string; nom: string }>) {
    const resolvedPhotoUrl = getStudentPictureSrc(photoUrl)

    if (!isValidPhotoSource(resolvedPhotoUrl)) {
        return (
            <div className="w-full aspect-square rounded-[6px] bg-faded/20 flex items-center justify-center">
                <Image
                    src="/icons/silhouette.svg"
                    alt="Photo non disponible"
                    width={64}
                    height={64}
                    className="opacity-40"
                />
            </div>
        )
    }

    return (
        <div className="w-full aspect-square relative rounded-[6px] overflow-hidden">
            <Image
                src={resolvedPhotoUrl}
                alt={`Photo de ${prenom} ${nom}`}
                fill
                unoptimized
                className="object-cover object-top"
            />
        </div>
    )
}

// Zone nom : couleur et icône adaptées au statut
function ZoneNom({ prenom, nom, statut, groupName }: Readonly<{ prenom: string; nom: string; statut: StatutEtudiant; groupName: string }>) {
    const isPresent = isEtudiantPresent(statut);
    const styleClasses = STYLES_ZONE_NOM[statut] ?? "";
    const isEnRetard = statut === StatutEtudiant["RETARD+5"]
        || statut === StatutEtudiant["RETARD+10"]
        || statut === StatutEtudiant["RETARD+15"];

    return (
        <div className={cn(
            "w-full flex items-center gap-3 border border-faded rounded-[6px] py-1 px-2",
            styleClasses
        )}>
            {/* Icône : check pour présent, horloge pour retard, QR pour non-scanné */}
            {isPresent && !isEnRetard && (
                <CheckIcon className="shrink-0 text-black" style={{ fontSize: "1.1rem" }} />
            )}
            {isEnRetard && (
                <AccessTimeIcon className="shrink-0 text-black" style={{ fontSize: "1.1rem" }} />
            )}
            {!isPresent && (
                <QrCodeScannerIcon className="shrink-0 text-faded" style={{ fontSize: "1.1rem" }} />
            )}

            <div className="w-full flex flex-col gap-0.75 min-w-0">
                <p className="truncate">{prenom}</p>
                <p className="truncate uppercase">{nom}</p>
            </div>
            <p className="text-xs text-muted-foreground">{groupName}</p>
        </div>
    )
}

export default function EtudiantCard({
    etudiant,
    onClick,
    isDisabled = false,
    isEditable = false
}: Readonly<EtudiantCardProps>) {
    const { firstName, lastName, picture, statut, groupName } = etudiant
    const isPresent = isEtudiantPresent(statut)
    const isClickable = isEditable && !isDisabled

    return (
        <button className={cn(
            "flex flex-col items-center gap-3 p-3 bg-background-alternative border border-faded rounded-[6px] text-center",
            // Carte non-présente : élévation Material M3/Elevation Light/3
            !isPresent && "shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_rgba(0,0,0,0.3)]",
            isDisabled && "opacity-70 cursor-not-allowed",
            isClickable && "cursor-pointer hover:bg-background-alternative/80 active:bg-background-alternative/60 transition-colors",
            !isEditable && "cursor-default"
        )}
            onClick={() => isEditable && onClick?.(etudiant)}
            type="button"
            disabled={isDisabled}
        >
            <PhotoEtudiant photoUrl={picture} prenom={firstName} nom={lastName} />
            <ZoneNom prenom={firstName} nom={lastName} statut={statut} groupName={groupName} />
        </button>
    )
}
