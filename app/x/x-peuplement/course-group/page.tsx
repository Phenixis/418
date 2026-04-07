import { sessionGroupQueries } from "@/lib/db/queries/session-group"

export default async function CourseGroupPage() {
    const courseGroups = await sessionGroupQueries.getAll()
    return (
        <div>
            <h1>Course Groups</h1>
            {
                "success" in courseGroups ? (
                    <ul>
                        {(courseGroups.entity as any[]).map((courseGroup) => (
                            <li key={courseGroup.sessionGroupId}>{JSON.stringify(courseGroup, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{courseGroups.error}</p>
                )
            }
        </div>
    )
}