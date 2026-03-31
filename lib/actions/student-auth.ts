"use server";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
	throw new Error("AUTH_SECRET environment variable is not set");
}
const key = new TextEncoder().encode(authSecret);
const STUDENT_STORAGE_KEY = "student_session";

type StudentSessionData = {
	expires: string;
	studentEmail: string;
	isPersistentSession: boolean;
};

export async function signStudentToken(payload: StudentSessionData) {
	const expirationTimestamp = Math.floor(new Date(payload.expires).getTime() / 1000);
	const fallbackExpirationTimestamp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
	const validatedExpirationTimestamp = Number.isFinite(expirationTimestamp)
		? expirationTimestamp
		: fallbackExpirationTimestamp;

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(validatedExpirationTimestamp)
		.sign(key);
}

export async function verifyStudentToken(input: string) {
	try {
		const { payload } = await jwtVerify(input, key, {
			algorithms: ["HS256"],
		});

		const typedPayload = payload as Record<string, unknown>;
		
		// Validate required fields
		if (typeof typedPayload.studentEmail !== "string" || !typedPayload.studentEmail) {
			console.error("Invalid token: missing or invalid studentEmail");
			return null;
		}

		// Validate isPersistentSession is actually a boolean, default to false if missing/invalid
		const isPersistentSession = typeof typedPayload.isPersistentSession === "boolean" 
			? typedPayload.isPersistentSession 
			: false;

		const tokenExpirationInSeconds =
			typeof typedPayload.exp === "number" ? typedPayload.exp : Math.floor(Date.now() / 1000);
		const expirationFromPayload =
			typeof typedPayload.expires === "string"
				? typedPayload.expires
				: new Date(tokenExpirationInSeconds * 1000).toISOString();

		return {
			expires: expirationFromPayload,
			studentEmail: typedPayload.studentEmail,
			isPersistentSession,
		} as StudentSessionData;
	} catch (error) {
		console.error("Student token verification failed:", error);
		return null;
	}
}

type SetStudentSessionInput = {
	studentEmail: string;
	isPersistentSession: boolean;
};

export async function setStudentSession(session: SetStudentSessionInput) {
	const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // You can adjust expiration for persistent vs non-persistent (for example 30 days if persistent)
    const expiration = session.isPersistentSession ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : expiresInOneDay;

	const sessionData: StudentSessionData = {
		expires: expiration.toISOString(),
		studentEmail: session.studentEmail,
		isPersistentSession: session.isPersistentSession,
	};
	const encryptedSession = await signStudentToken(sessionData);

	const cookieOptions = {
		name: STUDENT_STORAGE_KEY,
		value: encryptedSession,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		path: "/",
	};

	if (session.isPersistentSession) {
		(await cookies()).set({
			...cookieOptions,
			expires: expiration,
		});
	} else {
		(await cookies()).set(cookieOptions);
	}

	return encryptedSession;
}

export async function getStudentServerSession() {
	const cookieStore = await cookies();
	const credentialsSession = cookieStore.get(STUDENT_STORAGE_KEY)?.value;

	if (!credentialsSession) {
		return null;
	}

	try {
		const parsed = await verifyStudentToken(credentialsSession);

		if (!parsed?.studentEmail) {
			return null;
		}

		// Extend the session
		await setStudentSession({
			studentEmail: parsed.studentEmail,
			isPersistentSession: parsed.isPersistentSession,
		});

		return parsed;
	} catch (error) {
		console.error("Student session verification failed:", error);
		return null;
	}
}

export async function removeStudentSession() {
	"use server";
	const cookieStore = await cookies();
	cookieStore.delete({
		name: STUDENT_STORAGE_KEY,
		path: "/",
	});
}
