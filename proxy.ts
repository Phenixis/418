import { NextRequest, NextResponse } from "next/server"
import { signToken, verifyToken } from "./lib/actions/authentication"

const PROTECTED_ROUTES = [
	/^\/professeur(?!\/(connexion|inscription)).*$/gm,
]

const UNACCESSIBLE_ROUTES_WHEN_CONNECTEd = [
	/^\/professeur\/(connexion|inscription)$/gm,
]

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	const sessionCookie = request.cookies.get("teacher_session")

	const session = sessionCookie ? await verifyToken(sessionCookie.value) : null

	const isProtectedRoute = PROTECTED_ROUTES.some(route => new RegExp(route).exec(pathname))

	if (isProtectedRoute && !session) {
		return NextResponse.redirect(new URL("/professeur/connexion", request.nextUrl))
	}

	const isUnaccessibleWhenConnected = UNACCESSIBLE_ROUTES_WHEN_CONNECTEd.some(route => new RegExp(route).exec(pathname))

	if (isUnaccessibleWhenConnected && session) {
		return NextResponse.redirect(new URL("/professeur/dashboard", request.nextUrl))
	}

	if (session) {
		// Create a new response or clone the original
		const response = NextResponse.next()

		// Extend session expiration
		const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)
		const sessionData = {
			expires: expiresInOneDay.toISOString(),
			teacherEmail: session.teacherEmail,
			isPersistentSession: session.isPersistentSession,
		}

		// Sign a new token
		const newToken = await signToken(sessionData)

		// Set the new cookie in the response
		const cookieOptions = {
			name: "teacher_session",
			value: newToken,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax" as const,
			path: "/",
		}

		if (session.isPersistentSession) {
			response.cookies.set({
				...cookieOptions,
				expires: expiresInOneDay,
			})
		} else {
			response.cookies.set(cookieOptions)
		}

		return response
	}

	return NextResponse.next()
}