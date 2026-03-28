import TeachersTable from "@/components/admin/TeachersTable";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


export default async function GestionComptesPage() {
    const teachers = await teacherQueries.getAll();

    if ("error" in teachers) {
        return (
            <div className="p-4">
                <h1 className="h1">Gestion des comptes</h1>
                <p>Une erreur est survenue lors du chargement des comptes.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="h1">Gestion des comptes</h1>
            <Collapsible>
                <CollapsibleTrigger className="">
                    <h2 className="h2">Liste des professeurs</h2>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-2">
                    <TeachersTable />
                </CollapsibleContent>
            </Collapsible>
            <Collapsible>
                <CollapsibleTrigger className="">
                    <h2 className="h2">Liste des étudiants</h2>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-2">
                    <p>Cette section est en cours de développement.</p>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}