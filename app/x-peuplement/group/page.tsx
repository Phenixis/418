import { groupQueries } from "@/lib/db/queries/group"

export default async function GroupPage() {
    const groups = await groupQueries.getAll()
    return (
        <div>
            <h1>Groups</h1>
            {
                "success" in groups ? (
                    <ul>
                        {(groups.entity as any[]).map((group) => (
                            <li key={group.id}>{JSON.stringify(group, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{groups.error}</p>
                )
            }
        </div>
    )
}