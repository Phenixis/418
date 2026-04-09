import Image from 'next/image';
import EtudiantPhotoPlaceholder from './etudiant-photo-placeholder';
import { getStudentPictureSrc } from '@/lib/utils/student-picture';
import { cn } from '@/lib/utils';

export default function EtudiantPhoto({ photoUrl, prenom, nom, className }: Readonly<{ photoUrl: string | null; prenom: string; nom: string, className?: string }>) {
    const resolvedPhotoUrl = getStudentPictureSrc(photoUrl);

    if (!resolvedPhotoUrl) {
        return <EtudiantPhotoPlaceholder className={className} />;
    }

    return (
        <div className={cn(`w-full aspect-square relative rounded-[6px] overflow-hidden`, className)}>
            <Image src={resolvedPhotoUrl} alt={`Photo de ${prenom} ${nom}`} fill unoptimized className="object-cover object-top" />
        </div>
    );
}