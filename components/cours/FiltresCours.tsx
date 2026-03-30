"use client";

import { useState } from 'react';


type CourseFilter = 'all' | 'current' | 'upcoming' | 'past';

export default function FiltresCours() {
    const [selectedFilter, setSelectedFilter] = useState<CourseFilter>('all');

    const handleFilterChange = (filter: CourseFilter) => {
        setSelectedFilter(filter);
    };

    const filterButtons: Array<{ id: CourseFilter; label: string }> = [
        { id: 'all', label: 'Tous les cours' },
        { id: 'current', label: 'En cours' },
        { id: 'upcoming', label: 'À venir' },
        { id: 'past', label: 'Passés' },
    ];

    return (
        <div className="mb-4 flex gap-2">
            {filterButtons.map((button) => (
                <button
                    key={button.id}
                    onClick={() => handleFilterChange(button.id)}
                    className={`px-4 py-2 rounded transition-colors ${
                        selectedFilter === button.id
                            ? 'bg-primary hover:bg-primary-dark'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                >
                    {button.label}
                </button>
            ))}
        </div>
    );
}