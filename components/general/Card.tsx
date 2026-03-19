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
        <div className="student-card w-fit bg-white rounded-lg  overflow-hidden m-5 p-4">
            <img 
                src={photoUrl} 
                alt={photoAlt} 
                className="student-card__photo"
            />
            <div className="student-card__info">
                <h3 className="student-card__name">{firstName} {lastName}</h3>
            </div>
        </div>
    );
};