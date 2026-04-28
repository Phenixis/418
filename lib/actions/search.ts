'use server'

import { groupQueries } from '@/lib/db/queries/group'
import { resourceQueries } from '@/lib/db/queries/resource'
import { sessionQueries } from '@/lib/db/queries/session'
import { studentQueries } from '@/lib/db/queries/student'
import { teacherQueries } from '@/lib/db/queries/teacher'
import type { Select as Group } from '@/lib/db/schema/group'
import type { Select as Resource } from '@/lib/db/schema/resource'
import type { Select as Session } from '@/lib/db/schema/session'
import type { Select as Student } from '@/lib/db/schema/student'

/**
 * Aggregated data payload used to populate the global search index.
 *
 * Produced by {@link fetchSearchData}.
 */
export type SearchData = {
    resources: Resource[]
    sessions: Session[]
    students: Student[]
    groups: Group[]
}

/**
 * Fetches all searchable entities for the authenticated teacher.
 *
 * Resources and sessions are filtered to those owned by the teacher; students
 * and groups are fetched globally. Errors from individual queries are silently
 * swallowed and return empty arrays so a single failed query does not break search.
 *
 * @returns A {@link SearchData} object ready to be indexed by the search component.
 */
export async function fetchSearchData(): Promise<SearchData> {
    const teacher = await teacherQueries.getTeacher()

    const [resourcesResult, sessionsResult, studentsResult, groupsResult] = await Promise.all([
        resourceQueries.getByTeacherMail(teacher.userMail),
        sessionQueries.getByTeacherMail(teacher.userMail),
        studentQueries.getAll(),
        groupQueries.getAll(),
    ])

    return {
        resources: 'error' in resourcesResult ? [] : resourcesResult.entity,
        sessions: 'error' in sessionsResult ? [] : sessionsResult.entity,
        students: 'error' in studentsResult ? [] : studentsResult.entity,
        groups: 'error' in groupsResult ? [] : groupsResult.entity,
    }
}
