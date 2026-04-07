import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import QRCode from './QrCode';
import { CourseStatus } from './course.types';

export interface CourseInfoProps {
    /** Date du cours */
    date: Date;
    /** Heure de début (ex: 08h00) */
    heureDebut: string;
    /** Heure de fin (ex: 10h00) */
    heureFin: string;
    /** Classe concernée (ex: 3A) */
    classe: string;
    /** Nombre total d'étudiants */
    total: number;
    /** Nombre d'étudiants présents */
    presents: number;
    /** Nombre d'étudiants non scannés */
    nonScannes: number;
    /** ID du cours pour le lien du QRCode */
    idCours: string;
    /** Statut du cours pour adapter l'affichage si besoin */
    status: CourseStatus;
    /** Afficher ou non le QR code */
    showQrCode?: boolean;
    /** Masquer date, horaire et classe */
    shouldHideScheduleFields?: boolean;
}

// Formatte une date en "18 mars 2026"
function formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Champ d'information individuel (label + valeur)
function InfoField({
    label,
    value,
    isCompact = false
}: Readonly<{ label: string; value: string; isCompact?: boolean }>) {
    return (
        <div className={cn(
            'flex flex-col items-center gap-1 text-center sm:items-start sm:text-left',
            isCompact && 'flex-row items-center gap-2 whitespace-nowrap text-left'
        )}>
            <span className="font-faded">{label}</span>
            <span className={cn(isCompact && 'font-action')}>{value}</span>
        </div>
    );
}

export default function CourseInfo({
    date,
    heureDebut,
    heureFin,
    classe,
    total,
    presents,
    nonScannes,
    idCours,
    status,
    showQrCode = true,
    shouldHideScheduleFields = false
}: Readonly<CourseInfoProps>) {
    const dateFormatee = formatDate(date);
    const horaireFormate = `${heureDebut} — ${heureFin}`;
    const ENT_PAGE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? '') + '/etudiant?cours_id=' + idCours;
    const isCompactMode = shouldHideScheduleFields;

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            {/* Rectangle principal d'informations */}
            <Card className={cn('flex-1 max-w-full', isCompactMode && 'gap-2 py-3 shadow-md')}>
                {!isCompactMode && (
                    <CardHeader>
                        <h3 className="h3">Informations</h3>
                    </CardHeader>
                )}
                <CardContent className={cn(isCompactMode && 'px-4')}>
                    <div className={cn(
                        'grid grid-cols-2 gap-3 sm:flex sm:items-start sm:justify-between',
                        isCompactMode && 'flex flex-nowrap items-center justify-start gap-3 overflow-x-auto'
                    )}>
                        {!shouldHideScheduleFields && (
                            <>
                                <InfoField label="Date" value={dateFormatee} isCompact={isCompactMode} />
                                <Separator orientation="vertical" className="hidden self-stretch sm:block" />
                                <InfoField label="Horaire" value={horaireFormate} isCompact={isCompactMode} />
                                <Separator orientation="vertical" className="hidden self-stretch sm:block" />
                                <InfoField label="Classe" value={classe} isCompact={isCompactMode} />
                                <Separator orientation="vertical" className="hidden self-stretch sm:block" />
                            </>
                        )}
                        <InfoField label="Total" value={String(total)} isCompact={isCompactMode} />
                        <Separator orientation="vertical" className={cn('hidden self-stretch sm:block', isCompactMode && 'block h-5 self-center')} />
                        <InfoField label="Présents" value={String(presents)} isCompact={isCompactMode} />
                        <Separator orientation="vertical" className={cn('hidden self-stretch sm:block', isCompactMode && 'block h-5 self-center')} />
                        <InfoField label="Non-scannés" value={String(nonScannes)} isCompact={isCompactMode} />
                    </div>
                </CardContent>
            </Card>

            {
                showQrCode && status === CourseStatus.EN_COURS && (
                    <div className="flex items-center justify-center self-center sm:self-stretch sm:shrink-0">
                        <QRCode codePin={ENT_PAGE_URL} />
                    </div>
                )
            }
        </div>
    );
}
