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
}: Readonly<CourseInfoProps>) {
    const dateFormatee = formatDate(date);
    const toIso = (h: string) => h.replace('h', ':');
    const horaireFormate = `${new Date(`2000-01-01T${toIso(heureDebut)}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — ${new Date(`2000-01-01T${toIso(heureFin)}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    return (
        <div className="w-full flex-1 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            {/* Rectangle principal d'informations */}
            <Card className={cn('flex-1 max-w-full')}>
                <CardHeader>
                    <h3 className="h3">Informations</h3>
                </CardHeader>
                <CardContent>
                    <div className={cn(
                        'grid grid-cols-2 gap-3 sm:flex sm:items-start sm:justify-between',
                    )}>
                        <InfoField label="Date" value={dateFormatee} />
                        <Separator orientation="vertical" className="hidden self-stretch sm:block" />
                        <InfoField label="Horaire" value={horaireFormate} />
                        <Separator orientation="vertical" className="hidden self-stretch sm:block" />
                        <InfoField label="Classe" value={classe} />
                        <Separator orientation="vertical" className="hidden self-stretch sm:block" />
                        <InfoField label="Total" value={String(total)} />
                        <Separator orientation="vertical" className={cn('hidden self-stretch sm:block')} />
                        <InfoField label="Présents" value={String(presents)} />
                        <Separator orientation="vertical" className={cn('hidden self-stretch sm:block')} />
                        <InfoField label="Non-scannés" value={String(nonScannes)} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
