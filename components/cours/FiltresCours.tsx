"use client";

import { useState } from 'react';
import {Badge} from '@/components/ui/badge';


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
                <Badge
                    key={button.id}
                    onClick={() => handleFilterChange(button.id)}
                    variant={selectedFilter === button.id ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-gray-800 hover:text-white transition-colors"
                >
                    {button.label}
                </Badge>
            ))}
        </div>
    );
}