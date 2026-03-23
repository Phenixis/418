import EtudiantPhoto from './etudiant-photo';
import type { Select as Etudiant } from "@/lib/db/schema/student"

interface EtudiantCardProps {
    etudiant: Etudiant;
}

export default function EtudiantCard({ etudiant }: Readonly<EtudiantCardProps>) {
    const { firstName, lastName, picture } = etudiant;

    return (
        <div className="flex flex-col items-center gap-3 p-3 bg-background-alternative border border-faded rounded-[6px]">
            {/* Photo carrée */}
            <EtudiantPhoto photoUrl={picture} prenom={firstName} nom={lastName} />

            {/* Zone noms : encadré avec bordure propre */}
            <div className="w-full flex flex-col gap-1 border border-faded rounded-[6px] py-1 px-2">
                <p className="text-center truncate">{firstName}</p>
                <p className="text-center truncate">{lastName.toUpperCase()}</p>
            </div>
        </div>
    );
}
