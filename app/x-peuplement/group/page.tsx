import { groupQueries } from "@/lib/db/queries/group"

export default async function GroupPage() {
    const groups = await groupQueries.getAll()
    const groupId = await groupQueries.getById(1)
    return (
        <div>
            <h1>Groups</h1>
            {
                "success" in groups ? (
                    <ul>
                        {(groups.entity as any[]).map((group) => (
                            <li key={group.groupId}>{JSON.stringify(group, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{groups.error}</p>
                )
            }

            <h2>Group by ID</h2>
            {
                "success" in groupId ? (
                    <p>{JSON.stringify(groupId.entity, null, 2)}</p>
                ) : (
                    <p>{groupId.error}</p>
                )
            }
        </div>
    )
}