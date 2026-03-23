import { teacherQueries } from "@/lib/db/queries/teacher"

export default async function TeacherPage() {
    const teachers = await teacherQueries.getAll()
    const teacherId = await teacherQueries.getByEmail("benoit.tottereau@univ-rennes.fr")
    return (
        <div>
            <h1>Teachers</h1>
            {
                "success" in teachers ? (
                    <ul>
                        {(teachers.entity as any[]).map((teacher) => (
                            <li key={teacher.userMail}>{JSON.stringify(teacher, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{teachers.error}</p>
                )
            }
            <h2>Teacher by Email</h2>
            {
                "success" in teacherId ? (
                    <p>{JSON.stringify(teacherId.entity, null, 2)}</p>
                ) : (
                    <p>{teacherId.error}</p>
                )
            }
        </div>
    )
}