'use client';

import { CourseStatus } from '@/components/cours/course.types';
import { Button } from '@/components/ui/button';
import Vignette from '@/components/ui/Vignette';
import type { Select as Session } from '@/lib/db/schema/session';
import type { Select as Group } from '@/lib/db/schema/group';
import ResourceModal from './creation/ResourceModal';
import Link from 'next/link';

export { CourseStatus } from '@/components/cours/course.types';

export interface CourseHeaderProps {
    cours: Session
    groups: Group[]
    /** Statut actuel du cours */
    status: CourseStatus;
    /** Callback déclenché au clic sur "Terminer" */
    onTerminer?: () => void;
    /** Callback déclenché au clic sur "Démarrer le cours" */
    onDemarrer?: () => void;
}

export default function CourseHeader({ cours, groups, status, onTerminer, onDemarrer }: Readonly<CourseHeaderProps>) {
    return (
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            {/* Titre et vignette de statut */}
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h1 className="h1 uppercase">
                    {/* 
                        Je pensais qu'il était séparé en bdd 
                        Je laisse au cas où (ici+props+query) ça soit en effet nécessaire pour le sprint soutenance
                        {code} - {matiere}
                    */}
                    {cours.subject}
                </h1>
                <Vignette status={status} />
                <Link
                    href={`/professeur/resource/${cours.resourceId}`}
                    className="w-fit text-sm underline underline-offset-4 hover:opacity-70"
                >
                    Voir le détail de la ressource
                </Link>
            </div>

            {/* Actions sur le cours */}
            {(status === CourseStatus.A_VENIR || onTerminer || onDemarrer) && (
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                    {status === CourseStatus.A_VENIR && (
                        <ResourceModal initResource={{
                            resourceId: cours.resourceId,
                            subject: cours.subject,
                        }} />
                    )}
                    {onTerminer && (
                        <Button variant="default" onClick={onTerminer}>
                            Terminer
                        </Button>
                    )}
                    {onDemarrer && (
                        <Button variant="default" onClick={onDemarrer}>
                            Démarrer le cours
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
