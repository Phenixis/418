import { cn } from '@/lib/utils';
import { CourseStatus } from '@/components/cours/course.types';

// Couleurs de fond selon le statut (variables de la charte graphique)
const vignetteBackgrounds: Record<CourseStatus, string> = {
    [CourseStatus.EN_COURS]: 'bg-blue',
    [CourseStatus.TERMINE]: 'bg-green',
    [CourseStatus.A_VENIR]: 'bg-faded'
};

// Libellés affichés selon le statut
const vignetteLabels: Record<CourseStatus, string> = {
    [CourseStatus.EN_COURS]: 'En cours',
    [CourseStatus.TERMINE]: 'Terminé',
    [CourseStatus.A_VENIR]: 'À venir'
};

interface VignetteProps {
    status: CourseStatus;
    className?: string;
}

export default function Vignette({ status, className }: VignetteProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center justify-center rounded-[4px] px-2 py-[3px]',
                'font-faded text-white',
                vignetteBackgrounds[status],
                className
            )}
        >
            {vignetteLabels[status]}
        </span>
    );
}
