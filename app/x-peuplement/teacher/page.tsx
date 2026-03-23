import { teacherQueries } from "@/lib/db/queries/teacher"

export default async function TeacherPage() {
    const teachers = await teacherQueries.getAll()
    return (
        <div>
            <h1>Teachers</h1>
            {
                "success" in teachers ? (
                    <ul>
                        {(teachers.entity as any[]).map((teacher) => (
                            <li key={teacher.id}>{JSON.stringify(teacher, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{teachers.error}</p>
                )
            }
        </div>
    )
}