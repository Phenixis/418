'use client';

import { Button } from '@/components/ui/button';
import { CourseStatus } from '@/components/cours/course.types';
import Vignette from '@/components/ui/Vignette';

export { CourseStatus };

export interface CourseHeaderProps {
    /** Code de la matière (ex: R5.A.10) */
    code: string;
    /** Nom de la matière (ex: Management) */
    matiere: string;
    /** Statut actuel du cours */
    status: CourseStatus;
    /** Callback déclenché au clic sur "Modifier" */
    onModifier?: () => void;
    /** Callback déclenché au clic sur "Terminer" */
    onTerminer?: () => void;
}

export default function CourseHeader({ code, matiere, status, onModifier, onTerminer }: CourseHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            {/* Titre et vignette de statut */}
            <div className="flex items-center gap-3">
                <h1 className="h1 uppercase">
                    {code} - {matiere}
                </h1>
                <Vignette status={status} />
            </div>

            {/* Actions sur le cours */}
            {(onModifier || onTerminer) && (
                <div className="flex items-center gap-3">
                    {onModifier && (
                        <Button variant="ghost" onClick={onModifier}>
                            Modifier
                        </Button>
                    )}
                    {onTerminer && (
                        <Button variant="default" onClick={onTerminer}>
                            Terminer
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
