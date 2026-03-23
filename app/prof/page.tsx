'use client';

import Image from 'next/image';
import { useState } from 'react';

interface AttendeeInfo {
    activatedAt: Date;
}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Exemple de professeur */}
                <div
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-transform ${
                        attendees.has(1) ? 'scale-105 border-2 border-blue-500' : ''
                    }`}
                    onClick={() => toggleAttendee(1)}
                >
                    <Image
                        src="/images/person1.jpeg"
                        alt="Professeur 1"
                        width={200}
                        height={200}
                        className="rounded-full mb-4"
                    />
                    <h2 className="text-xl font-semibold text-gray-800">Dr. Alice Dupont</h2>
                    <p className="text-gray-600">Spécialité: Mathématiques</p>
                </div>

                {/* Ajouter d'autres professeurs ici */}
            </div>
        </div>
    );
}
