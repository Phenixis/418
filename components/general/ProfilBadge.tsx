import React from 'react';

interface ProfilBadgeProps {
    firstName: string;
    lastName: string;
}

export default function ProfilBadge({ firstName, lastName }: ProfilBadgeProps) {
    return (
        <div className="flex items-center justify-center rounded-full bg-white w-10 h-10 border border-color-black">
            <p className="font-bold">{firstName.charAt(0)}{lastName.charAt(0)}</p>
        </div>  
    );
};