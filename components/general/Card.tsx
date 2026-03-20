import React from 'react';

interface StudentCardProps {
    firstName: string;
    lastName: string;
    photoUrl: string;
    photoAlt?: string;
}

export const StudentCard: React.FC<StudentCardProps> = ({
    firstName,
    lastName,
    photoUrl,
    photoAlt = `${firstName} ${lastName}`,
}) => {
    return (
        <div className="w-full max-w-60 overflow-hidden rounded-xl border border-faded bg-background-alternative p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <img
                src={photoUrl}
                alt={photoAlt}
                loading="lazy"
                className="h-44 w-full rounded-lg object-cover"
            />
            <div className="mt-3 space-y-1">
                <h3 className="h3 leading-tight">{firstName} {lastName}</h3>

            </div>
        </div>
    );
};