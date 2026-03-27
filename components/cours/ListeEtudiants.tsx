import EtudiantCard from '@/components/cours/EtudiantCard';
import { StudentWithStatus } from '@/lib/actions/cours-actuel';

interface ListeEtudiantsProps {
    etudiants: StudentWithStatus[];
}

export default function ListeEtudiants({ etudiants }: Readonly<ListeEtudiantsProps>) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {etudiants.slice()
            .sort((a, b) => {
                const groupComparison = a.groupName.localeCompare(b.groupName);
                if (groupComparison !== 0) return groupComparison;
                const lastNameComparison = a.lastName.localeCompare(b.lastName);
                if (lastNameComparison !== 0) return lastNameComparison;
                return a.firstName.localeCompare(b.firstName);
            })
            .map(etudiant => (
                <EtudiantCard key={etudiant.userMail} etudiant={etudiant} />
            ))}
        </div>
    );
}
