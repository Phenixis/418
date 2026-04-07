import TeachersTable from '@/components/admin/TeachersTable';

export default function GestionProfesseursPage() {
    return (
        <div className="p-4 space-y-4">
            <h1 className="h1">Gestion des professeurs</h1>
            <TeachersTable />
        </div>
    );
}
