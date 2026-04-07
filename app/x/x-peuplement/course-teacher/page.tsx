import { resourceTeacherQueries } from "@/lib/db/queries/resource-teacher"

export default async function CourseTeacherPage() {
    const courseTeachers = await resourceTeacherQueries.getAll()
    return (
        <div>
            <h1>Course Teachers</h1>
            {
                "success" in courseTeachers ? (
                    <ul>
                        {(courseTeachers.entity as any[]).map((courseTeacher) => (
                            <li key={courseTeacher.resourceTeacherId}>{JSON.stringify(courseTeacher, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{courseTeachers.error}</p>
                )
            }
        </div>
    )
}