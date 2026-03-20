import PersonIcon from '@mui/icons-material/Person';
import Image from 'next/image';

export interface Etudiant {
    id: string;
    prenom: string;
    nom: string;
    /** URL de la photo, null si indisponible */
    photoUrl: string | null;
}

interface EtudiantCardProps {
    etudiant: Etudiant;
}

// Affiche la photo carrée de l'étudiant, ou une silhouette générique si indisponible
function PhotoEtudiant({ photoUrl, prenom, nom }: { photoUrl: string | null; prenom: string; nom: string }) {
    if (!photoUrl) {
        return (
            <div className="w-full aspect-square rounded-[6px] bg-faded/20 flex items-center justify-center">
                <PersonIcon className="text-faded" style={{ fontSize: '4rem' }} />
            </div>
        );
    }

    return (
        <div className="w-full aspect-square relative rounded-[6px] overflow-hidden">
            <Image src={photoUrl} alt={`Photo de ${prenom} ${nom}`} fill className="object-cover object-top" />
        </div>
    );
}

export default function EtudiantCard({ etudiant }: EtudiantCardProps) {
    const { prenom, nom, photoUrl } = etudiant;

    return (
        <div className="flex flex-col items-center gap-3 p-3 bg-background-alternative border border-faded rounded-[6px]">
            {/* Photo carrée */}
            <PhotoEtudiant photoUrl={photoUrl} prenom={prenom} nom={nom} />

            {/* Zone noms : encadré avec bordure propre */}
            <div className="w-full flex flex-col gap-[3px] border border-faded rounded-[6px] py-1 px-2">
                <p className="text-center truncate">{prenom}</p>
                <p className="text-center truncate">{nom}</p>
            </div>
        </div>
    );
}
