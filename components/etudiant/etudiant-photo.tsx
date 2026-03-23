import Image from 'next/image';
import EtudiantPhotoPlaceholder from './etudiant-photo-placeholder';

export default function EtudiantPhoto({ photoUrl, prenom, nom }: Readonly<{ photoUrl: string | null; prenom: string; nom: string }>) {
    if (!photoUrl) {
        return <EtudiantPhotoPlaceholder />;
    }

    return (
        <div className="w-full aspect-square relative rounded-[6px] overflow-hidden">
            <Image src={photoUrl} alt={`Photo de ${prenom} ${nom}`} fill className="object-cover object-top" />
        </div>
    );
}