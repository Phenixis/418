import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export interface CourseInfoProps {
    /** Date du cours */
    date: Date
    /** Heure de début (ex: 08h00) */
    heureDebut: string
    /** Heure de fin (ex: 10h00) */
    heureFin: string
    /** Classe concernée (ex: 3A) */
    classe: string
    /** Nombre total d'étudiants */
    total: number
    /** Nombre d'étudiants présents */
    presents: number
    /** Nombre d'étudiants non scannés */
    nonScannes: number
}

// Formatte une date en "18 mars 2026"
function formatDate(date: Date): string {
    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

// Champ d'information individuel (label + valeur)
function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-faded">{label}</span>
            <span>{value}</span>
        </div>
    )
}

export default function CourseInfo({
    date,
    heureDebut,
    heureFin,
    classe,
    total,
    presents,
    nonScannes,
}: CourseInfoProps) {
    const dateFormatee = formatDate(date)
    const horaireFormate = `${heureDebut} — ${heureFin}`

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

            {/* Placeholder QR Code — carré de même hauteur que le rectangle d'informations */}
            <div className="self-stretch w-36 shrink-0 rounded-xl border border-dashed border-faded bg-background-alternative flex items-center justify-center">
                <span className="font-faded text-xs">QR Code</span>
            </div>

        </div>
    )
}
