'use client';

import { useState } from 'react';
import Logo from '@/components/general/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SettingsIcon from '@mui/icons-material/Settings';
import { StudentCard } from '@/components/general/Card';

// Interface pour représenter un étudiant
interface Student {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string;
    year: string;
    tdGroup: string;
    tpGroup: string;
}

// Options disponibles pour les groupes TD et TP
const TD_GROUP_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const TP_GROUP_OPTIONS = ['1', '2'];
const YEAR_LABELS = ['1ère année', '2ème année', '3ème année'];
const GROUP_COMBINATIONS = TD_GROUP_OPTIONS.flatMap(tdGroup =>
    TP_GROUP_OPTIONS.map(tpGroup => ({
        tdGroup,
        tpGroup,
        label: `${tdGroup}${tpGroup}`
    }))
);

// Liste des étudiants avec leurs infos
const STUDENTS: Student[] = [
    {
        id: 1,
        firstName: 'Jean',
        lastName: 'Dupont',
        photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
        year: '1ère année',
        tdGroup: 'A',
        tpGroup: '1'
    },
    {
        id: 2,
        firstName: 'Marie',
        lastName: 'Curie',
        photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
        year: '2ème année',
        tdGroup: 'B',
        tpGroup: '2'
    },
    {
        id: 3,
        firstName: 'Alice',
        lastName: 'Smith',
        photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
        year: '3ème année',
        tdGroup: 'C',
        tpGroup: '1'
    },
    {
        id: 4,
        firstName: 'Bob',
        lastName: 'Johnson',
        photoUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
        year: '1ère année',
        tdGroup: 'D',
        tpGroup: '1'
    },
    {
        id: 5,
        firstName: 'Lucie',
        lastName: 'Martin',
        photoUrl: 'https://randomuser.me/api/portraits/women/10.jpg',
        year: '2ème année',
        tdGroup: 'E',
        tpGroup: '1'
    },
    {
        id: 6,
        firstName: 'Noah',
        lastName: 'Bernard',
        photoUrl: 'https://randomuser.me/api/portraits/men/11.jpg',
        year: '3ème année',
        tdGroup: 'A',
        tpGroup: '1'
    },
    // 1ère année
    {
        id: 7,
        firstName: 'Sophie',
        lastName: 'Leclerc',
        photoUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
        year: '1ère année',
        tdGroup: 'A',
        tpGroup: '2'
    },
    {
        id: 8,
        firstName: 'Marc',
        lastName: 'Fontaine',
        photoUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
        year: '1ère année',
        tdGroup: 'B',
        tpGroup: '1'
    },
    {
        id: 9,
        firstName: 'Claire',
        lastName: 'Moreau',
        photoUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
        year: '1ère année',
        tdGroup: 'B',
        tpGroup: '2'
    },
    {
        id: 10,
        firstName: 'David',
        lastName: 'Girard',
        photoUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
        year: '1ère année',
        tdGroup: 'C',
        tpGroup: '1'
    },
    {
        id: 11,
        firstName: 'Emma',
        lastName: 'Petit',
        photoUrl: 'https://randomuser.me/api/portraits/women/5.jpg',
        year: '1ère année',
        tdGroup: 'C',
        tpGroup: '2'
    },
    {
        id: 12,
        firstName: 'Thomas',
        lastName: 'Durand',
        photoUrl: 'https://randomuser.me/api/portraits/men/5.jpg',
        year: '1ère année',
        tdGroup: 'D',
        tpGroup: '2'
    },
    {
        id: 13,
        firstName: 'Laura',
        lastName: 'Renard',
        photoUrl: 'https://randomuser.me/api/portraits/women/6.jpg',
        year: '1ère année',
        tdGroup: 'E',
        tpGroup: '1'
    },
    {
        id: 14,
        firstName: 'Lucas',
        lastName: 'Gauthier',
        photoUrl: 'https://randomuser.me/api/portraits/men/6.jpg',
        year: '1ère année',
        tdGroup: 'E',
        tpGroup: '2'
    },
    // 2ème année
    {
        id: 15,
        firstName: 'Chloé',
        lastName: 'Deschamps',
        photoUrl: 'https://randomuser.me/api/portraits/women/7.jpg',
        year: '2ème année',
        tdGroup: 'A',
        tpGroup: '1'
    },
    {
        id: 16,
        firstName: 'Pierre',
        lastName: 'Leblanc',
        photoUrl: 'https://randomuser.me/api/portraits/men/7.jpg',
        year: '2ème année',
        tdGroup: 'A',
        tpGroup: '2'
    },
    {
        id: 17,
        firstName: 'Isabelle',
        lastName: 'Mercier',
        photoUrl: 'https://randomuser.me/api/portraits/women/8.jpg',
        year: '2ème année',
        tdGroup: 'B',
        tpGroup: '1'
    },
    {
        id: 18,
        firstName: 'François',
        lastName: 'Delorme',
        photoUrl: 'https://randomuser.me/api/portraits/men/8.jpg',
        year: '2ème année',
        tdGroup: 'C',
        tpGroup: '1'
    },
    {
        id: 19,
        firstName: 'Nathalie',
        lastName: 'Lefevre',
        photoUrl: 'https://randomuser.me/api/portraits/women/9.jpg',
        year: '2ème année',
        tdGroup: 'C',
        tpGroup: '2'
    },
    {
        id: 20,
        firstName: 'Michel',
        lastName: 'Garnier',
        photoUrl: 'https://randomuser.me/api/portraits/men/9.jpg',
        year: '2ème année',
        tdGroup: 'D',
        tpGroup: '1'
    },
    {
        id: 21,
        firstName: 'Valérie',
        lastName: 'Chevallier',
        photoUrl: 'https://randomuser.me/api/portraits/women/11.jpg',
        year: '2ème année',
        tdGroup: 'D',
        tpGroup: '2'
    },
    {
        id: 22,
        firstName: 'Jean-Paul',
        lastName: 'Lacharme',
        photoUrl: 'https://randomuser.me/api/portraits/men/10.jpg',
        year: '2ème année',
        tdGroup: 'E',
        tpGroup: '2'
    },
    // 3ème année
    {
        id: 23,
        firstName: 'Sandrine',
        lastName: 'Rossi',
        photoUrl: 'https://randomuser.me/api/portraits/women/12.jpg',
        year: '3ème année',
        tdGroup: 'A',
        tpGroup: '2'
    },
    {
        id: 24,
        firstName: 'Christian',
        lastName: 'Blondel',
        photoUrl: 'https://randomuser.me/api/portraits/men/12.jpg',
        year: '3ème année',
        tdGroup: 'B',
        tpGroup: '1'
    },
    {
        id: 25,
        firstName: 'Stéphanie',
        lastName: 'Damond',
        photoUrl: 'https://randomuser.me/api/portraits/women/13.jpg',
        year: '3ème année',
        tdGroup: 'B',
        tpGroup: '2'
    },
    {
        id: 26,
        firstName: 'André',
        lastName: 'Rosenberg',
        photoUrl: 'https://randomuser.me/api/portraits/men/13.jpg',
        year: '3ème année',
        tdGroup: 'C',
        tpGroup: '2'
    },
    {
        id: 27,
        firstName: 'Nicole',
        lastName: 'Collard',
        photoUrl: 'https://randomuser.me/api/portraits/women/14.jpg',
        year: '3ème année',
        tdGroup: 'D',
        tpGroup: '1'
    },
    {
        id: 28,
        firstName: 'Jacques',
        lastName: 'Blanc',
        photoUrl: 'https://randomuser.me/api/portraits/men/14.jpg',
        year: '3ème année',
        tdGroup: 'D',
        tpGroup: '2'
    },
    {
        id: 29,
        firstName: 'Dominique',
        lastName: 'Pepin',
        photoUrl: 'https://randomuser.me/api/portraits/women/15.jpg',
        year: '3ème année',
        tdGroup: 'E',
        tpGroup: '1'
    },
    {
        id: 30,
        firstName: 'Robert',
        lastName: 'Gillet',
        photoUrl: 'https://randomuser.me/api/portraits/men/15.jpg',
        year: '3ème année',
        tdGroup: 'E',
        tpGroup: '2'
    }
];

export default function TrombinoscopePage() {
    const [searchQuery, setSearchQuery] = useState('');

    const getStudentsByYearAndGroup = (yearLabel: string, tdGroup: string, tpGroup: string) =>
        STUDENTS.filter(student => {
            const matchesYear = student.year === yearLabel;
            const matchesTdGroup = student.tdGroup === tdGroup;
            const matchesTpGroup = student.tpGroup === tpGroup;
            const matchesSearch =
                student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.lastName.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesYear && matchesTdGroup && matchesTpGroup && matchesSearch;
        });

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header avec logo et navigation */}
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
                    <Input placeholder="Rechercher" className="w-48 bg-white rounded-full" />
                    <Button variant="ghost" size="icon">
                        <SettingsIcon />
                    </Button>
                </div>
            </div>

            {/* Contenu principal */}
            <main className="flex-1 p-8">
                <div className="flex items-start gap-4 mb-8">
                    <h1 className="text-2xl h1 font-display">Trombinoscope</h1>
                    <Input
                        placeholder="Chercher un étudiant, un groupe, une classe,..."
                        className="w-full bg-white rounded-lg"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    {YEAR_LABELS.map(yearLabel => {
                        return (
                            <details
                                key={yearLabel}
                                className="rounded-lg border border-faded bg-background-alternative px-4 py-3"
                               
                            >
                                <summary className="cursor-pointer text-2xl font-display">{yearLabel}</summary>

                                <div className="mt-3 space-y-2 pl-4">
                                    {GROUP_COMBINATIONS.map(({ tdGroup, tpGroup, label }) => {
                                        const studentsByGroup = getStudentsByYearAndGroup(yearLabel, tdGroup, tpGroup);

                                        return (
                                            <details key={label} className="rounded-md px-2 py-1">
                                                <summary className="cursor-pointer text-lg font-medium">
                                                    {label}
                                                </summary>

                                                <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                    {studentsByGroup.length > 0 ? (
                                                        studentsByGroup.map(student => (
                                                            <StudentCard
                                                                key={student.id}
                                                                firstName={student.firstName}
                                                                lastName={student.lastName}
                                                                photoUrl={student.photoUrl}
                                                            />
                                                        ))
                                                    ) : (
                                                        <p className="font-faded">Aucun étudiant dans ce groupe.</p>
                                                    )}
                                                </div>
                                            </details>
                                        );
                                    })}
                                </div>
                            </details>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
