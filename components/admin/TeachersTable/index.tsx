import { Suspense } from "react";
import TeachersTableBody from "./TeachersTableBody";
import TeachersTableBodySkeleton from "./TeachersTableBodySkeleton";
import TeachersTableLayout from "./TeachersTableLayout";


export default function TeachersTable() {
    return (
        <TeachersTableLayout>
            <Suspense fallback={<TeachersTableBodySkeleton />}>
                <TeachersTableBody />
            </Suspense>
        </TeachersTableLayout>
    )
}