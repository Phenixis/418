import TagsList from "@/components/tags/TagsList";
import { studentTagQueries } from "@/lib/db/queries/student-tag";
import { teacherQueries } from "@/lib/db/queries/teacher";

export default async function TagsPage() {
    const teacher = await teacherQueries.getTeacher();

    const tagsWithStudentsResult = await studentTagQueries.getTagsWithStudents(teacher.userMail);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="h1">Tags</h1>
                <p className="text-muted-foreground">
                    Organisez vos étudiants en groupes personnalisés (projets, soutenances…)
                </p>
            </header>
            <TagsList tagsWithStudents={tagsWithStudentsResult.entity} />
        </div>
    );
}
