"use client"

import CheckIcon from "@mui/icons-material/Check"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { StatutEtudiant } from "@/components/cours/course.types"

export interface Etudiant {
    id: string
    prenom: string
    nom: string
    /** URL de la photo — null si indisponible */
    photoUrl: string | null
    /** Statut de présence pour ce cours */
    statut: StatutEtudiant
}

interface EtudiantCardProps {
    etudiant: Etudiant
}

// Affiche la photo carrée de l'étudiant, ou une silhouette générique si indisponible
function PhotoEtudiant({ photoUrl, prenom, nom }: { photoUrl: string | null; prenom: string; nom: string }) {
    if (!photoUrl) {
        return (
            <div className="w-full aspect-square rounded-[6px] bg-faded/20 flex items-center justify-center">
                <img
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
function ZoneNom({ prenom, nom, isPresent }: { prenom: string; nom: string; isPresent: boolean }) {
    return (
        <div className={cn(
            "w-full flex items-center gap-3 border border-faded rounded-[6px] py-1 px-2",
            isPresent && "bg-green border-green"
        )}>
            {isPresent && <CheckIcon className="shrink-0 text-black" style={{ fontSize: "1.1rem" }} />}
            <div className="flex flex-col gap-[3px] min-w-0">
                <p className="truncate">{prenom}</p>
                <p className="truncate">{nom}</p>
            </div>
        </div>
    )
}

export default function EtudiantCard({ etudiant }: EtudiantCardProps) {
    const { prenom, nom, photoUrl, statut } = etudiant
    const isPresent = statut === StatutEtudiant.PRESENT

    return (
        <div className={cn(
            "flex flex-col items-center gap-3 p-3 bg-background-alternative border border-faded rounded-[6px]",
            // Carte absente : élévation Material M3/Elevation Light/3
            !isPresent && "shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_rgba(0,0,0,0.3)]"
        )}>
            <PhotoEtudiant photoUrl={photoUrl} prenom={prenom} nom={nom} />
            <ZoneNom prenom={prenom} nom={nom} isPresent={isPresent} />
        </div>
    )
}
