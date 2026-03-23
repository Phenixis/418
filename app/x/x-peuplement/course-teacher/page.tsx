import { courseTeacherQueries } from "@/lib/db/queries/course-teacher"

export default async function CourseTeacherPage() {
    const courseTeachers = await courseTeacherQueries.getAll()
    return (
        <div>
            <h1>Course Teachers</h1>
            {
                "success" in courseTeachers ? (
                    <ul>
                        {(courseTeachers.entity as any[]).map((courseTeacher) => (
                            <li key={courseTeacher.courseTeacherId}>{JSON.stringify(courseTeacher, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{courseTeachers.error}</p>
                )
            }
        </div>
    )
}