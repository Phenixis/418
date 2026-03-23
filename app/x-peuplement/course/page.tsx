import { courseQueries } from "@/lib/db/queries/course"

export default async function CoursePage() {
    const courses = await courseQueries.getAll()
    return (
        <div>
            <h1>Courses</h1>
            {
                "success" in courses ? (
                    <ul>
                        {(courses.entity as any[]).map((course) => (
                            <li key={course.id}>{JSON.stringify(course, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{courses.error}</p>
                )
            }
        </div>
    )
}