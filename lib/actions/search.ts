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

export type SearchData = {
    resources: Resource[]
    sessions: Session[]
    students: Student[]
    groups: Group[]
}

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
