import EtudiantCard, { Etudiant } from '@/components/cours/EtudiantCard';
import { StatutEtudiant } from '@/components/cours/course.types';

// --- Données mockées (à remplacer par les interfaces ORM une fois établies) ---
const mockEtudiants: Etudiant[] = [
    {
        id: '1',
        prenom: 'Maxime',
        nom: 'Duhamel',
        photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '2',
        prenom: 'Nathan',
        nom: 'Thuault',
        photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
        statut: StatutEtudiant.ABSENT
    },
    {
        id: '3',
        prenom: 'Peter',
        nom: 'Parker',
        photoUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '4',
        prenom: 'Marlène',
        nom: 'Dubois',
        photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '5',
        prenom: 'Enzo',
        nom: 'Letaillandier',
        photoUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
        statut: StatutEtudiant.ABSENT
    },
    {
        id: '6',
        prenom: 'Jean-Marie',
        nom: 'De La Grande Botte Sur La Meur',
        photoUrl: 'https://randomuser.me/api/portraits/men/11.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '7',
        prenom: 'Olivier',
        nom: 'Minne',
        photoUrl: 'https://randomuser.me/api/portraits/men/52.jpg',
        statut: StatutEtudiant.ABSENT
    },
    {
        id: '8',
        prenom: 'Scarlett',
        nom: 'Johansson',
        photoUrl: 'https://randomuser.me/api/portraits/women/55.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '9',
        prenom: 'Dora',
        nom: "L'Exploratrice",
        photoUrl: 'https://randomuser.me/api/portraits/women/33.jpg',
        statut: StatutEtudiant.ABSENT
    },
    {
        id: '10',
        prenom: 'Maxence',
        nom: 'Dahemul',
        photoUrl: 'https://randomuser.me/api/portraits/men/41.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '11',
        prenom: 'André',
        nom: 'Agassi',
        photoUrl: 'https://randomuser.me/api/portraits/men/28.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '12',
        prenom: 'Valérie',
        nom: 'Bourdeau',
        photoUrl: 'https://randomuser.me/api/portraits/women/17.jpg',
        statut: StatutEtudiant.ABSENT
    },
    { id: '13', prenom: 'Sophie', nom: 'Martin', photoUrl: null, statut: StatutEtudiant.ABSENT },
    {
        id: '14',
        prenom: 'Lucas',
        nom: 'Bernard',
        photoUrl: 'https://randomuser.me/api/portraits/men/63.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '15',
        prenom: 'Camille',
        nom: 'Lefebvre',
        photoUrl: 'https://randomuser.me/api/portraits/men/19.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '16',
        prenom: 'Rayan',
        nom: 'Chouaib',
        photoUrl: 'https://randomuser.me/api/portraits/men/88.jpg',
        statut: StatutEtudiant.ABSENT
    },
    {
        id: '17',
        prenom: 'Inès',
        nom: 'Rousseau',
        photoUrl: 'https://randomuser.me/api/portraits/women/29.jpg',
        statut: StatutEtudiant.PRESENT
    },
    {
        id: '18',
        prenom: 'Tom',
        nom: 'Girard',
        photoUrl: 'https://randomuser.me/api/portraits/men/5.jpg',
        statut: StatutEtudiant.ABSENT
    }
];
// ----------------------------------------------------------------------------

interface ListeEtudiantsProps {
    etudiants?: Etudiant[];
}

export default function ListeEtudiants({ etudiants = mockEtudiants }: ListeEtudiantsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {etudiants.map(etudiant => (
                <EtudiantCard key={etudiant.id} etudiant={etudiant} />
            ))}
        </div>
    );
}
