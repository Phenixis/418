'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Person {
    id: number;
    nom: string;
    prenom: string;
    photo: string;
}

interface AttendeeInfo {
    activatedAt: Date;
}

const people: Person[] = [
    {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        photo: '/images/person1.jpeg',
    },
    {
        id: 2,
        nom: 'Martin',
        prenom: 'Marie',
        photo: '/images/person2.jpeg',
    },
    {
        id: 3,
        nom: 'Bernard',
        prenom: 'Pierre',
        photo: '/images/person3.jpeg',
    },
    {
        id: 4,
        nom: 'Thomas',
        prenom: 'Sophie',
        photo: '/images/person4.jpeg',
    },
];

export default function ProfPage() {
    const [attendees, setAttendees] = useState<Map<number, AttendeeInfo>>(new Map());

    const toggleAttendee = (id: number) => {
        const newAttendees = new Map(attendees);
        if (newAttendees.has(id)) {
            newAttendees.delete(id);
        } else {
            newAttendees.set(id, { activatedAt: new Date() });
        }
        setAttendees(newAttendees);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-12">Professeurs</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {people.map((person) => {
                    const attendeeInfo = attendees.get(person.id);
                    return (
                        <div
                            key={person.id}
                            onClick={() => toggleAttendee(person.id)}
                            className={`rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer ${
                                attendeeInfo
                                    ? 'bg-white ring-2 ring-green-500'
                                    : 'bg-gray-300 opacity-50'
                            }`}
                        >
                            <div className="relative w-full h-48">
                                <Image
                                    src={person.photo}
                                    alt={`${person.prenom} ${person.nom}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="p-4 text-center">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {person.prenom} {person.nom}
                                </h2>
                                {attendeeInfo && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        {attendeeInfo.activatedAt.toLocaleTimeString('fr-FR')}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}