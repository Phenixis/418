import { courseQueries } from "@/lib/db/queries/course"

export default async function CoursePage() {
    const courses = await courseQueries.getAll()
    const courseId = await courseQueries.getByStringId("123456789")
    return (
        <div>
            <h1>Courses</h1>
            {
                "success" in courses ? (
                    <ul>
                        {(courses.entity as any[]).map((course) => (
                            <li key={course.courseId}>{JSON.stringify(course, null, 2)}</li>
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