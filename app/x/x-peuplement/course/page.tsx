import { sessionQueries } from "@/lib/db/queries/session"

export default async function CoursePage() {
    const courses = await sessionQueries.getAll()
    const courseId = await sessionQueries.getByStringId("123456789")
    return (
        <div>
            <h1>Courses</h1>
            {
                "success" in courses ? (
                    <ul>
                        {(courses.entity as any[]).map((course) => (
                            <li key={course.sessionId}>{JSON.stringify(course, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{courses.error}</p>
                )
            }

            <h2>Course by ID</h2>
            {
                "success" in courseId ? (
                    <p>{JSON.stringify(courseId.entity, null, 2)}</p>
                ) : (
                    <p>{courseId.error}</p>
                )
            }
        </div>
    )
}