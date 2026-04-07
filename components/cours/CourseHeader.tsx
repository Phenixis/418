'use client';

import { CourseStatus } from '@/components/cours/course.types';
import { Button } from '@/components/ui/button';
import Vignette from '@/components/ui/Vignette';
import type { Select as Session } from '@/lib/db/schema/session';
import type { Select as Group } from '@/lib/db/schema/group';
import CoursModal from './creation/CoursModal';

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
        <div className="flex items-center justify-between">
            {/* Titre et vignette de statut */}
            <div className="flex items-center gap-3">
                <h1 className="h1 uppercase">
                    {/* 
                        Je pensais qu'il était séparé en bdd 
                        Je laisse au cas où (ici+props+query) ça soit en effet nécessaire pour le sprint soutenance
                        {code} - {matiere}
                    */}
                    {cours.subject}
                </h1>
                <Vignette status={status} />
            </div>

            {/* Actions sur le cours */}
            {(status === CourseStatus.A_VENIR || onTerminer || onDemarrer) && (
                <div className="flex items-center gap-3">
                    {status === CourseStatus.A_VENIR && (
                        <CoursModal initCourse={{
                            ...cours,
                            groups
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
