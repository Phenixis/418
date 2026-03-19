'use client';

import { useState } from 'react';
import Logo from '@/components/general/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SettingsIcon from '@mui/icons-material/Settings';
import { StudentCard } from '@/components/general/Card';

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string;
    year: string;
}

const STUDENTS: Student[] = [
    {
        id: 1,
        firstName: 'Jean',
        lastName: 'Dupont',
        photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
        year: '1ère année',
    },
    {
        id: 2,
        firstName: 'Marie',
        lastName: 'Curie',
        photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
        year: '2ème année',
    },
    {
        id: 3,
        firstName: 'Alice',
        lastName: 'Smith',
        photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
        year: '3ème année',
    },
    {
        id: 4,
        firstName: 'Bob',
        lastName: 'Johnson',
        photoUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
        year: '1ère année',
    },
];

export default function TrombinoscopePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const yearLabels = ['1ère année', '2ème année', '3ème année'];

    const getStudentsByYear = (yearLabel: string) =>
        STUDENTS.filter((student) => {
            const matchesYear = student.year === yearLabel;
        const matchesSearch =
            student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesYear && matchesSearch;
        });

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex p-3 m-5">
                <Logo className="w-12 h-12 absolute left-15" />
                <nav className="flex-1 flex justify-start items-center gap-2 ml-20 md:ml-40 lg:ml-110">
                    <Button variant="link" className="text-sm md:text-base">
                        Dashboard
                    </Button>
                    <Button variant="link" className="underline text-sm md:text-base">
                        Trombinoscope
                    </Button>
                </nav>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Rechercher"
                        className="w-48 bg-white rounded-full"
                    />
                    <Button variant="ghost" size="icon">
                        <SettingsIcon />
                    </Button>
                </div>
            </div>
            <main className="flex-1 p-8">
                <div className="flex items-start gap-4 mb-8">
                    <h1 className="text-2xl h1 font-display">Trombinoscope</h1>
                    <Input
                        placeholder="Chercher un étudiant, un groupe, une classe,..."
                        className="w-full bg-white rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    {yearLabels.map((yearLabel) => {
                        const studentsByYear = getStudentsByYear(yearLabel);

                        return (
                            <details
                                key={yearLabel}
                                className="rounded-lg border border-faded bg-background-alternative px-4 py-3"
                            >
                                <summary className="cursor-pointer text-2xl font-display">
                                    {yearLabel}
                                </summary>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {studentsByYear.length > 0 ? (
                                        studentsByYear.map((student) => (
                                            <StudentCard
                                                key={student.id}
                                                firstName={student.firstName}
                                                lastName={student.lastName}
                                                photoUrl={student.photoUrl}
                                            />
                                        ))
                                    ) : (
                                        <p className="font-faded">Aucun étudiant pour cette recherche.</p>
                                    )}
                                </div>
                            </details>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
