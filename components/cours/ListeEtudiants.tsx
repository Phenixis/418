import EtudiantCard, { Etudiant } from '@/components/cours/EtudiantCard';

// --- Données mockées (à remplacer par les interfaces ORM une fois établies) ---
const mockEtudiants: Etudiant[] = [
    { id: '1', prenom: 'Maxime', nom: 'Duhamel', photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: '2', prenom: 'Nathan', nom: 'Thuault', photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: '3', prenom: 'Peter', nom: 'Parker', photoUrl: 'https://randomuser.me/api/portraits/men/75.jpg' },
    { id: '4', prenom: 'Marlène', nom: 'Dubois', photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { id: '5', prenom: 'Enzo', nom: 'Letaillandier', photoUrl: 'https://randomuser.me/api/portraits/women/22.jpg' },
    { id: '6', prenom: 'Jean-Marie', nom: 'De La Granddsqkjkdhqlksjdhqlkdjqslkdjh', photoUrl: 'https://randomuser.me/api/portraits/men/11.jpg' },
    { id: '7', prenom: 'Olivier', nom: 'Minne', photoUrl: 'https://randomuser.me/api/portraits/men/52.jpg' },
    { id: '8', prenom: 'Scarlett', nom: 'Johansson', photoUrl: 'https://randomuser.me/api/portraits/women/55.jpg' },
    { id: '9', prenom: 'Dora', nom: "L'Exploratrice", photoUrl: 'https://randomuser.me/api/portraits/women/33.jpg' },
    { id: '10', prenom: 'Maxence', nom: 'Dahemul', photoUrl: 'https://randomuser.me/api/portraits/men/41.jpg' },
    { id: '11', prenom: 'André', nom: 'Agassi', photoUrl: 'https://randomuser.me/api/portraits/men/28.jpg' },
    { id: '12', prenom: 'Valérie', nom: 'Bourdeau', photoUrl: 'https://randomuser.me/api/portraits/women/17.jpg' },
    { id: '13', prenom: 'Sophie', nom: 'Martin', photoUrl: null }, // photo manquante — affiche silhouette
    { id: '14', prenom: 'Lucas', nom: 'Bernard', photoUrl: 'https://randomuser.me/api/portraits/men/63.jpg' },
    { id: '15', prenom: 'Camille', nom: 'Lefebvre', photoUrl: 'https://randomuser.me/api/portraits/men/19.jpg' },
    { id: '16', prenom: 'Rayan', nom: 'Chouaib', photoUrl: 'https://randomuser.me/api/portraits/men/88.jpg' },
    { id: '17', prenom: 'Inès', nom: 'Rousseau', photoUrl: 'https://randomuser.me/api/portraits/women/29.jpg' },
    { id: '18', prenom: 'Tom', nom: 'Girard', photoUrl: 'https://randomuser.me/api/portraits/men/5.jpg' }
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
