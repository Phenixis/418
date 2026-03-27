"use client"

import CheckIcon from "@mui/icons-material/Check"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { StatutEtudiant } from "@/components/cours/course.types"
import { StudentWithStatus } from "@/lib/actions/cours-actuel"

interface EtudiantCardProps {
    etudiant: StudentWithStatus
}

// Affiche la photo carrée de l'étudiant, ou une silhouette générique si indisponible
function PhotoEtudiant({ photoUrl, prenom, nom }: Readonly<{ photoUrl: string | null; prenom: string; nom: string }>) {
    if (!photoUrl) {
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
                src={photoUrl}
                alt={`Photo de ${prenom} ${nom}`}
                fill
                className="object-cover object-top"
            />
        </div>
    )
}

// Zone nom : fond vert + checkmark si présent, fond neutre sinon
function ZoneNom({ prenom, nom, isPresent, groupName }: Readonly<{ prenom: string; nom: string; isPresent: boolean; groupName: string }>) {
    return (
        <div className={cn(
            "w-full flex items-center gap-3 border border-faded rounded-[6px] py-1 px-2",
            isPresent && "bg-green border-green"
        )}>
            {isPresent && <CheckIcon className="shrink-0 text-black" style={{ fontSize: "1.1rem" }} />}
            <div className="w-full flex flex-col gap-0.75 min-w-0">
                <p className="truncate">{prenom}</p>
                <p className="truncate uppercase">{nom}</p>
            </div>
                <p className="text-xs text-muted-foreground">{groupName}</p>
        </div>
    )
}

export default function EtudiantCard({ etudiant }: Readonly<EtudiantCardProps>) {
    const { firstName, lastName, picture, statut, groupName } = etudiant
    const isPresent = statut === StatutEtudiant.PRESENT

    return (
        <div className={cn(
            "flex flex-col items-center gap-3 p-3 bg-background-alternative border border-faded rounded-[6px] text-center",
            // Carte absente : élévation Material M3/Elevation Light/3
            !isPresent && "shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_rgba(0,0,0,0.3)]"
        )}>
            <PhotoEtudiant photoUrl={picture} prenom={firstName} nom={lastName} />
            <ZoneNom prenom={firstName} nom={lastName} isPresent={isPresent} groupName={groupName} />
        </div>
    )
}
