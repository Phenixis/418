"use server";

import bcrypt from "bcrypt";
import { teacherQueries } from "../db/queries/teacher";
import { ActionResult } from "./types";
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

export async function login(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const email = formData.get("email");
    const password = formData.get("password");

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
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        teacherEmail: teacherResult.entity.userMail
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

    return {
        success: true,
        redirectTo: "/professeur/dashboard?onboarding=true",
    };

}

const key = new TextEncoder().encode(process.env.AUTH_SECRET)
const STORAGE_KEY = "teacher_session"

type TeacherSessionData = {
	expires: string
	teacherEmail: string
}

export async function signToken(payload: TeacherSessionData) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("1 day from now")
		.sign(key)
}

export async function verifyToken(input: string) {
	try {
		const { payload } = await jwtVerify(input, key, {
			algorithms: ["HS256"],
		})
		return payload as TeacherSessionData
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
		await setSession(parsed)

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

export async function setSession(session?: TeacherSessionData) {
	const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)
	const sessionData: TeacherSessionData = session || {
		expires: expiresInOneDay.toISOString(),
		teacherEmail: "" // Default empty string if no userId provided
	}
	const encryptedSession = await signToken(sessionData);
	
	(await cookies()).set({
			name: STORAGE_KEY,
			value: encryptedSession,
			expires: expiresInOneDay,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
		})

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
