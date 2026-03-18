'use client';

import Image from 'next/image';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { Button } from '@/components/ui/button';

interface Person {
    id: number;
    nom: string;
    prenom: string;
    photo: string;
}

interface AttendeeInfo {
    activatedAt: Date;
}

const ENT_PAGE_URL = 'https://ent.univ-rennes1.fr/f/bureau/normal/render.uP';

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
    // attendees : map des personnes activées, clé = id de la personne, valeur = heure d'activation
    const [attendees, setAttendees] = useState<Map<number, AttendeeInfo>>(new Map());
    // isQrCodeVisible : contrôle l'affichage du bloc QR code
    const [isQrCodeVisible, setIsQrCodeVisible] = useState(false);
    // isQrCodeOverlayVisible : contrôle l'overlay plein écran du QR code
    const [isQrCodeOverlayVisible, setIsQrCodeOverlayVisible] = useState(false);

    // toggleAttendee(id) : ajoute/supprime une personne de la map des activés
    const toggleAttendee = (id: number) => {
        const newAttendees = new Map(attendees);
        if (newAttendees.has(id)) {
            newAttendees.delete(id);
        } else {
            newAttendees.set(id, { activatedAt: new Date() });
        }
        setAttendees(newAttendees);
    };

    // Affiche ou masque le QR code
    const handleToggleQrCodeVisibility = () => {
        const shouldShowQrCode = !isQrCodeVisible;
        setIsQrCodeVisible(shouldShowQrCode);

        if (!shouldShowQrCode) {
            setIsQrCodeOverlayVisible(false);
        }
    };

    const handleOpenQrCodeOverlay = () => {
        setIsQrCodeOverlayVisible(true);
    };

    const handleCloseQrCodeOverlay = () => {
        setIsQrCodeOverlayVisible(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-12">Professeurs</h1>

            <div className=" flex flex-col items-start gap-4">
                <Button onClick={handleToggleQrCodeVisibility}>
                    {isQrCodeVisible ? 'Masquer le QR code' : 'Générer le QR code'}
                </Button>

                {isQrCodeVisible && (
                    // group : permet d'appliquer group-hover sur les coins
                    // relative : base de positionnement pour les coins en absolute
                    // rounded-[15px] : rayon du conteneur à 15px
                    <div
                        className="group relative cursor-zoom-in rounded-[15px] bg-white p-1 shadow-md transition-all duration-200 hover:shadow-xl"
                        onClick={handleOpenQrCodeOverlay}
                    >
                        {/* Coin haut-gauche : left-2/top-2 = position, h-5/w-5 = taille, border-l/border-t = traits visibles */}
                        <span className="pointer-events-none absolute left-1 top-1 h-6 w-6 rounded-tl-[15px] border-l-4 border-t-4 border-black opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        {/* Coin haut-droit */}
                        <span className="pointer-events-none absolute right-1 top-1 h-6 w-6 rounded-tr-[15px] border-r-4 border-t-4 border-black opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        {/* Coin bas-gauche */}
                        <span className="pointer-events-none absolute bottom-1 left-1 h-6 w-6 rounded-bl-[15px] border-b-4 border-l-4 border-black opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        {/* Coin bas-droit */}
                        <span className="pointer-events-none absolute bottom-1 right-1 h-6 w-6 rounded-br-[15px] border-b-4 border-r-4 border-black opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                        {/* value : URL encodée dans le QR, size : taille en px, includeMargin : marge blanche autour du code */}
                        <QRCodeSVG value={ENT_PAGE_URL} size={100} includeMargin />
                    </div>
                )}
            </div>

            {isQrCodeOverlayVisible && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={handleCloseQrCodeOverlay}
                >
                    <div
                        className="rounded-[15px] bg-white p-4 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <QRCodeSVG value={ENT_PAGE_URL} size={560} includeMargin />
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {people.map((person) => {
                    const attendeeInfo = attendees.get(person.id);
                    return (
                        <div
                            key={person.id}
                            onClick={() => toggleAttendee(person.id)}
                            // hover:scale-[1.02] = léger zoom, hover:shadow-2xl = ombre plus forte, hover:ring-2 = contour au survol
                            className={`relative rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:ring-2 hover:ring-green-400 ${
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