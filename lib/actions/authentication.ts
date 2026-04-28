"use server";

import bcrypt from "bcrypt";
import { teacherQueries } from "../db/queries/teacher";
import { ActionResult } from "./types";
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { redirect } from "next/navigation";

/**
 * Authenticates a teacher with email and password.
 *
 * Creates a JWT session cookie on success. The email field is the local part
 * only — `@univ-rennes.fr` is appended automatically.
 *
 * @param _prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Must include `email`, `password`, and optionally `remember`.
 * @returns `{ success: true, redirectTo: string }` on success, or an error result.
 */
export async function login(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
	const email = formData.get("email");
	const password = formData.get("password");
	const remember = formData.get("remember") === "on";

	if (typeof email !== "string" || typeof password !== "string") {
		return {
			error: true,
			message: "Veuillez fournir un email et un mot de passe valides.",
		};
	}

	const completeEmail = email + "@univ-rennes.fr";

	const teacherResult = await teacherQueries.getByEmail(completeEmail);

	if ("error" in teacherResult) {
		return {
			error: true,
			message: "Email ou mot de passe incorrect.",
		};
	}

	if (teacherResult.entity.password === null || teacherResult.entity.password.trim() === "") {
		return {
			error: true,
			message: "Email ou mot de passe incorrect.",
		};
	}

	const isPasswordValid = await bcrypt.compare(password, teacherResult.entity.password);

	if (!isPasswordValid) {
		return {
			error: true,
			message: "Email ou mot de passe incorrect.",
		};
	}

	await setSession({
		teacherEmail: teacherResult.entity.userMail,
		isPersistentSession: remember,
	})

	return {
		success: true,
		redirectTo: "/professeur/dashboard",
	};
}

/**
 * Registers a new teacher account and logs them in immediately.
 *
 * Returns an error if an account with the same email already exists. On
 * success, creates the account, hashes the password with bcrypt (cost 12),
 * sets a session cookie, and returns a redirect to the onboarding flow.
 *
 * @param _prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Must include `first-name`, `last-name`, `email`, `password`,
 *   and optionally `remember`.
 * @returns `{ success: true, redirectTo: string }` on success, or an error result.
 */
export async function register(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
	const firstName = formData.get("first-name");
	const lastName = formData.get("last-name");
	const email = formData.get("email");
	const password = formData.get("password");
	const remember = formData.get("remember") === "on";

	if (
		typeof firstName !== "string" ||
		typeof lastName !== "string" ||
		typeof email !== "string" ||
		typeof password !== "string"
	) {
		return {
			error: true,
			message: "Veuillez remplir correctement tous les champs.",
		};
	}

	const completeEmail = email + "@univ-rennes.fr";

	const existingTeacher = await teacherQueries.getByEmail(completeEmail);

	if ("success" in existingTeacher) {
		return {
			error: true,
			message: "Un compte existe déjà avec cet email.",
		};
	}

	const hashedPassword = await bcrypt.hash(password, 12);
	const creationResult = await teacherQueries.create({
		firstName,
		lastName,
		userMail: completeEmail,
		password: hashedPassword,
		isTeacher: true,
	});

	if ("error" in creationResult) {
		return {
			error: true,
			message: "Une erreur est survenue lors de l'inscription.",
		};
	}

	await setSession({
		teacherEmail: creationResult.entity.userMail,
		isPersistentSession: remember,
	})

	return {
		success: true,
		redirectTo: "/professeur/dashboard?onboarding=true",
	};

}

const authSecret = process.env.AUTH_SECRET
if (!authSecret) {
	throw new Error("AUTH_SECRET environment variable is not set")
}
const key = new TextEncoder().encode(authSecret)
const STORAGE_KEY = "teacher_session"

export type TeacherSessionData = {
	expires: string
	teacherEmail: string
	isPersistentSession: boolean
}

/**
 * Signs a teacher session payload as a HS256 JWT.
 *
 * @param payload - Session data to encode, including expiry.
 * @returns The signed JWT string.
 */
export async function signToken(payload: TeacherSessionData) {
	const expirationTimestamp = Math.floor(new Date(payload.expires).getTime() / 1000)
	const fallbackExpirationTimestamp = Math.floor(Date.now() / 1000) + 24 * 60 * 60
	const validatedExpirationTimestamp = Number.isFinite(expirationTimestamp)
		? expirationTimestamp
		: fallbackExpirationTimestamp

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(validatedExpirationTimestamp)
		.sign(key)
}

/**
 * Verifies a HS256 JWT and returns the decoded teacher session payload.
 *
 * @param input - The JWT string to verify.
 * @returns The decoded session data, or `null` when the token is invalid or expired.
 */
export async function verifyToken(input: string) {
	try {
		const { payload } = await jwtVerify(input, key, {
			algorithms: ["HS256"],
		})

		const typedPayload = payload as Record<string, unknown>
		const tokenExpirationInSeconds =
			typeof typedPayload.exp === "number" ? typedPayload.exp : Math.floor(Date.now() / 1000)
		const expirationFromPayload =
			typeof typedPayload.expires === "string"
				? typedPayload.expires
				: new Date(
					tokenExpirationInSeconds * 1000,
				).toISOString()

		return {
			expires: expirationFromPayload,
			teacherEmail: typeof typedPayload.teacherEmail === "string" ? typedPayload.teacherEmail : "",
			isPersistentSession: typedPayload.isPersistentSession !== false,
		} as TeacherSessionData
	} catch (error) {
		console.error("Token verification failed:", error)
		return null
	}
}

/**
 * Reads and verifies the teacher session from the request cookie (client-side use).
 *
 * Unlike {@link getServerSession}, this function does **not** extend the session
 * expiry. Intended for non-critical reads where a rolling session is undesirable.
 *
 * @returns The session data, or `null` when no valid session cookie is present.
 */
export async function getClientSession() {
	const cookieStore = await cookies()
	const credentialsSession = cookieStore.get(STORAGE_KEY)?.value

	if (!credentialsSession) {
		return null
	}

	try {
		// Verify the token
		const parsed = await verifyToken(credentialsSession)

		if (!parsed) {
			return null
		}

		return parsed
	} catch (error) {
		// Handle invalid or expired token
		console.error("Session verification failed:", error)
		return null
	}
}

/**
 * Reads, verifies, and **extends** the teacher session cookie.
 *
 * Intended for use in Server Components and Server Actions. Each call rolls the
 * session expiry forward by one day. Returns `null` when no valid session exists.
 *
 * @returns The session data with the teacher email, or `null`.
 */
export async function getServerSession() {
	const cookieStore = await cookies()
	const credentialsSession = cookieStore.get(STORAGE_KEY)?.value

	if (!credentialsSession) {
		return null
	}

	try {
		// Verify the token
		const parsed = await verifyToken(credentialsSession)

		if (!parsed?.teacherEmail) {
			return null
		}

		// Extend the session expiration by reusing setSession
		await setSession({
			teacherEmail: parsed.teacherEmail,
			isPersistentSession: parsed.isPersistentSession,
		})

		return parsed
	} catch (error) {
		// Handle invalid or expired token
		console.error("Session verification failed:", error)
		return null
	}
}

/**
 * Verifies a raw session cookie string without extending its expiry.
 *
 * Used by the proxy middleware, which reads the cookie value directly from
 * request headers rather than through Next.js `cookies()`.
 *
 * @param sessionCookie - The raw cookie value, or `undefined` when absent.
 * @returns The decoded session data, or `null` when invalid or missing.
 */
export async function verifySession(sessionCookie: string | undefined) {
	if (!sessionCookie) {
		return null
	}

	try {
		return await verifyToken(sessionCookie)
	} catch (error) {
		// Handle invalid or expired token
		console.error("Session verification failed:", error)
		return null
	}
}

export type SetSessionInput = {
	teacherEmail: string
	isPersistentSession: boolean
}

/**
 * Creates or refreshes the teacher session cookie.
 *
 * For persistent sessions the cookie has an explicit expiry date; for
 * non-persistent sessions it is set as a session cookie (no `expires`).
 * Always sets `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
 *
 * @param session - Teacher email and persistence preference.
 * @returns The signed JWT stored in the cookie.
 */
export async function setSession(session: SetSessionInput) {
	const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)
	const sessionData: TeacherSessionData = {
		expires: expiresInOneDay.toISOString(),
		teacherEmail: session.teacherEmail,
		isPersistentSession: session.isPersistentSession,
	}
	const encryptedSession = await signToken(sessionData);

	const cookieOptions = {
		name: STORAGE_KEY,
		value: encryptedSession,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		path: "/",
	}

	if (session.isPersistentSession) {
		(await cookies()).set({
			...cookieOptions,
			expires: expiresInOneDay,
		})
	} else {
		(await cookies()).set(cookieOptions)
	}

	return encryptedSession
}

/**
 * Deletes the teacher session cookie, effectively logging the user out.
 */
export async function removeSession() {
	"use server"
	// Await the cookies() function before calling delete()
	// Specify the path to ensure the cookie is properly deleted
	const cookieStore = await cookies()
	cookieStore.delete({
		name: STORAGE_KEY,
		path: "/",
	})
}

/**
 * Returns a minimal user object for the currently authenticated teacher.
 *
 * @returns `{ id: teacherEmail }` when a valid session exists, or `null`.
 */
export async function getUser() {
	const session = await getServerSession()
	if (!session) {
		return null
	}
	return {
		id: session.teacherEmail
	}
}


/**
 * Logs the current teacher out and redirects to the login page.
 *
 * Removes the session cookie via {@link removeSession} then calls
 * Next.js `redirect`. This function never returns normally.
 */
export async function logout() {
    "use server"

    await removeSession();

    redirect('/professeur/connexion');
}