"use server";

import bcrypt from "bcrypt";
import { teacherQueries } from "../db/queries/teacher";
import { ActionResult } from "./types";
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { redirect } from "next/navigation";

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

type TeacherSessionData = {
	expires: string
	teacherEmail: string
	isPersistentSession: boolean
}

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

// For server components and server actions
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
			await removeSession()
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

// For proxy - only verifies, doesn't extend
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

type SetSessionInput = {
	teacherEmail: string
	isPersistentSession: boolean
}

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

export async function getUser() {
	const session = await getServerSession()
	if (!session) {
		return null
	}
	return {
		id: session.teacherEmail
	}
}


export async function logout() {
    "use server"

    await removeSession();

    redirect('/professeur/connexion');
}