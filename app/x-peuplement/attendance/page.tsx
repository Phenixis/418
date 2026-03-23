import { attendanceQueries } from "@/lib/db/queries/attendance"

export default async function AttendancePage() {
    const attendances = await attendanceQueries.getAll()
    return (
        <div>
            <h1>Attendances</h1>
            {
                "success" in attendances ? (
                    <ul>
                        {(attendances.entity as any[]).map((attendance) => (
                            <li key={attendance.id}>{JSON.stringify(attendance, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{attendances.error}</p>
                )
            }
        </div>
    )
}