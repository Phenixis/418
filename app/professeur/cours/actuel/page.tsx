'use client';

import { useState } from 'react';
import CourseHeader, { CourseStatus } from '@/components/cours/CourseHeader';
import CourseInfo from '@/components/cours/CourseInfo';
import ListeEtudiants from '@/components/cours/ListeEtudiants';

// --- Données mockées (à remplacer par les interfaces ORM une fois établies) ---
const mockCours = {
    code: 'R5.A.10',
    matiere: 'Management',
    status: CourseStatus.EN_COURS,
    date: new Date(2026, 2, 18), // 18 mars 2026
    heureDebut: '08h00',
    heureFin: '10h00',
    classe: '3A',
    total: 27,
    presents: 25,
    nonScannes: 2
};
// ----------------------------------------------------------------------------

export default function AppelPage() {
    const [isEnCours, setIsEnCours] = useState(true);

    function handleModifier() {
        // TODO : ouvrir la modale d'édition du cours
        console.log('Modifier le cours');
    }

    function handleTerminer() {
        // TODO : déclencher la fin du cours
        setIsEnCours(false);
        console.log('Terminer le cours');
    }

    return (
        <section className="container mx-auto flex flex-col py-10 gap-6">
            {/* En-tête : matière, statut et actions */}
            <CourseHeader
                code={mockCours.code}
                matiere={mockCours.matiere}
                status={isEnCours ? CourseStatus.EN_COURS : CourseStatus.TERMINE}
                onModifier={handleModifier}
                onTerminer={isEnCours ? handleTerminer : undefined}
            />

            {/* Rectangle d'informations du cours */}
            <CourseInfo
                date={mockCours.date}
                heureDebut={mockCours.heureDebut}
                heureFin={mockCours.heureFin}
                classe={mockCours.classe}
                total={mockCours.total}
                presents={mockCours.presents}
                nonScannes={mockCours.nonScannes}
            />

            {/* Liste des étudiants du cours */}
            <ListeEtudiants />
        </section>
    );
}
