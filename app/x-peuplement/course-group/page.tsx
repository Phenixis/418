import { courseGroupQueries } from "@/lib/db/queries/course-group"

export default async function CourseGroupPage() {
    const courseGroups = await courseGroupQueries.getAll()
    return (
        <div>
            <h1>Course Groups</h1>
            {
                "success" in courseGroups ? (
                    <ul>
                        {(courseGroups.entity as any[]).map((courseGroup) => (
                            <li key={courseGroup.courseGroupId}>{JSON.stringify(courseGroup, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{courseGroups.error}</p>
                )
            }
        </div>
    )
}