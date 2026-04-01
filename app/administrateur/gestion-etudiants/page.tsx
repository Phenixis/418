import StudentsTable from '@/components/admin/StudentsTable';

export default function GestionEtudiantsPage() {
    return (
        <div className="p-4 space-y-4">
            <h1 className="h1">Gestion des étudiants</h1>
            <StudentsTable />
        </div>
    );
}
