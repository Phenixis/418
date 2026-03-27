import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const STORAGE_KEY = 'teacher_session'

async function deleteSessionCookieAndRedirect(requestUrl: string) {
    const cookieStore = await cookies()
    cookieStore.delete({
        name: STORAGE_KEY,
        path: '/',
    })

    return NextResponse.redirect(new URL('/professeur/connexion', requestUrl))
}

export async function GET(request: Request) {
    return deleteSessionCookieAndRedirect(request.url)
}

export async function POST(request: Request) {
    return deleteSessionCookieAndRedirect(request.url)
}