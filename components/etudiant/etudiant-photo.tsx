import Image from 'next/image';
import EtudiantPhotoPlaceholder from './etudiant-photo-placeholder';
import { getStudentPictureSrc } from '@/lib/utils/student-picture';

export default function EtudiantPhoto({ photoUrl, prenom, nom }: Readonly<{ photoUrl: string | null; prenom: string; nom: string }>) {
    const resolvedPhotoUrl = getStudentPictureSrc(photoUrl);

    if (!resolvedPhotoUrl) {
        return <EtudiantPhotoPlaceholder />;
    }

    return (
        <div className="w-full aspect-square relative rounded-[6px] overflow-hidden">
            <Image src={resolvedPhotoUrl} alt={`Photo de ${prenom} ${nom}`} fill unoptimized className="object-cover object-top" />
        </div>
    );
}