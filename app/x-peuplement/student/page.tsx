import { studentQueries } from "@/lib/db/queries/student"

export default async function StudentPage() {
    const students = await studentQueries.getAll()
    return (
        <div>
            <h1>Students</h1>
            {
                "success" in students ? (
                    <ul>
                        {(students.entity as any[]).map((student) => (
                            <li key={student.userMail}>{JSON.stringify(student, null, 2)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{students.error}</p>
                )
            }
        </div>
    )
}