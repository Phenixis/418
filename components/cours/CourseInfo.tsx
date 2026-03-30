import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
function InfoField({ label, value }: Readonly<{ label: string; value: string }>) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-faded">{label}</span>
            <span>{value}</span>
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
    status
}: Readonly<CourseInfoProps>) {
    const dateFormatee = formatDate(date);
    const horaireFormate = `${heureDebut} — ${heureFin}`;
    const ENT_PAGE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? '') + '/etudiant?cours_id=' + idCours;

    return (
        <div className="flex items-stretch gap-4">
            {/* Rectangle principal d'informations */}
            <Card className="flex-1 max-w-full">
                <CardHeader>
                    <h3 className="h3">Informations</h3>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start justify-between">
                        <InfoField label="Date" value={dateFormatee} />
                        <Separator orientation="vertical" className="self-stretch" />
                        <InfoField label="Horaire" value={horaireFormate} />
                        <Separator orientation="vertical" className="self-stretch" />
                        <InfoField label="Classe" value={classe} />
                        <Separator orientation="vertical" className="self-stretch" />
                        <InfoField label="Total" value={String(total)} />
                        <Separator orientation="vertical" className="self-stretch" />
                        <InfoField label="Présents" value={String(presents)} />
                        <Separator orientation="vertical" className="self-stretch" />
                        <InfoField label="Non-scannés" value={String(nonScannes)} />
                    </div>
                </CardContent>
            </Card>

            {
                status === CourseStatus.EN_COURS && (
                    <div className="self-stretch shrink-0 flex items-center justify-center">
                        <QRCode codePin={ENT_PAGE_URL} />
                    </div>
                )
            }
        </div>
    );
}
