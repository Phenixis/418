"use server";

import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import * as schema from "@/lib/db/schema";
import { sessionQueries } from "@/lib/db/queries/session";
import { studentQueries } from "@/lib/db/queries/student";
import { passwordRules } from "@/components/login/rules";
import { publishAttendanceRealtimeEvent } from "@/lib/realtime/provider-server";
import { getStudentServerSession, setStudentSession } from "@/lib/actions/student-auth";
import { normalizeStudentEmail } from "@/lib/utils/student-email";

type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type CourseData = {
  sessionId: string;
  courseName: string;
};

type StudentStepData = {
  nextStep: "PASSWORD" | "CREATE_PASSWORD";
  courseName: string;
};

const DATABASE_CONNECTION_ERROR_MESSAGE =
  "Impossible de contacter la base de données pour le moment. Réessayez dans quelques instants.";

const EMPTY_STUDENT_SENTINEL = 'null';

function hasStudentPassword(storedPassword: string | null | undefined): boolean {
  const normalizedPassword = (storedPassword ?? "").trim();
  return (
    normalizedPassword !== "" &&
    normalizedPassword.toLowerCase() !== EMPTY_STUDENT_SENTINEL
  );
}

function getValidatedStudentEmail(email: string): string | null {
  return normalizeStudentEmail(email);
}

function parseDateValue(dateValue: Date | string | null): Date | null {
  if (!dateValue) {
    return null;
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isMidnightDate(dateValue: Date): boolean {
  return (
    dateValue.getUTCHours() === 0 &&
    dateValue.getUTCMinutes() === 0 &&
    dateValue.getUTCSeconds() === 0 &&
    dateValue.getUTCMilliseconds() === 0
  );
}

function getActionErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const loweredMessage = error.message.toLowerCase();
    if (loweredMessage.includes("fetch failed") || loweredMessage.includes("error connecting to database")) {
      return DATABASE_CONNECTION_ERROR_MESSAGE;
    }

    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

async function checkPasswordMatch(
  rawPassword: string,
  storedPassword: string | null | undefined
): Promise<boolean> {
  if (!hasStudentPassword(storedPassword)) {
    return false;
  }

  const normalizedStoredPassword = (storedPassword ?? "").trim();

  // Bcrypt PHP/MySQL utilise souvent le prefixe $2y$; Node attend $2b$.
  const normalizedHash = normalizedStoredPassword.startsWith("$2y$")
    ? `$2b$${normalizedStoredPassword.slice(4)}`
    : normalizedStoredPassword;

  // Compatibilite: autorise les anciens mots de passe non haches pendant la transition.
  if (!normalizedHash.startsWith("$2")) {
    return rawPassword === normalizedHash;
  }

  return bcrypt.compare(rawPassword, normalizedHash);
}

async function getValidCourse(sessionId: string): Promise<ServerActionResult<CourseData>> {
  try {
    const foundCourse = await sessionQueries.getByStringId(sessionId);
    if ("error" in foundCourse) {
      return { success: false, error: "Cours non reconnu (ID invalide)." };
    }

    const course = foundCourse.entity;
    const courseStartAt = parseDateValue(course.startAt);
    const courseEndAt = parseDateValue(course.endAt);

    if (!courseStartAt || !courseEndAt) {
      return { success: false, error: "Le cours a des dates invalides." };
    }

    const normalizedCourseStartAt = new Date(courseStartAt);
    const normalizedCourseEndAt = new Date(courseEndAt);

    // Quand la base fournit une date sans heure (minuit), on considère la journee complete.
    if (isMidnightDate(normalizedCourseEndAt)) {
      normalizedCourseEndAt.setUTCHours(23, 59, 59, 999);
    }

    const now = new Date();
    const hasStarted = course.manualCallStartAt !== null || normalizedCourseStartAt <= now;
    const hasEnded = course.manualCallEndAt !== null || normalizedCourseEndAt < now;

    if (!hasStarted) {
      return { success: false, error: "La connexion à ce cours n'est pas encore ouverte." };
    }

    if (hasEnded) {
      return { success: false, error: "La connexion à ce cours est terminée." };
    }

    return {
      success: true,
      data: {
        sessionId: course.sessionId,
        courseName: course.subject,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}

async function hasStudentAccessToCourse(studentMail: string, sessionId: string): Promise<boolean> {
  const result = await db
    .select({ groupId: schema.StudentTable.table.groupId })
    .from(schema.StudentTable.table)
    .where(eq(schema.StudentTable.table.userMail, studentMail))
    .limit(1);

  if (result.length === 0 || result[0].groupId === null) {
    return false;
  }

  const matchingCourseGroup = await db
    .select({ sessionGroupId: schema.SessionGroupTable.table.sessionGroupId })
    .from(schema.SessionGroupTable.table)
    .where(
      and(
        eq(schema.SessionGroupTable.table.sessionId, sessionId),
        eq(schema.SessionGroupTable.table.groupId, result[0].groupId)
      )
    )
    .limit(1);

  return matchingCourseGroup.length > 0;
}

export async function getCourseStatusAction(sessionId: string): Promise<ServerActionResult<CourseData>> {
  if (!sessionId?.trim()) {
    return { success: false, error: "Aucun cours détecté. Veuillez scanner un QR Code." };
  }

  return getValidCourse(sessionId.trim());
}

export async function checkStudentEmailAction(
  email: string,
  sessionId: string
): Promise<ServerActionResult<StudentStepData>> {
  try {
    const normalizedEmail = getValidatedStudentEmail(email);
    if (!normalizedEmail) {
      return {
        success: false,
        error: "Veuillez entrer une adresse email étudiante valide.",
      };
    }

    if (!sessionId?.trim()) {
      return { success: false, error: "Aucun cours détecté. Veuillez scanner un QR Code." };
    }

    const validCourse = await getValidCourse(sessionId);
    if (!validCourse.success) {
      return { success: false, error: validCourse.error };
    }

    const foundStudent = await studentQueries.getByEmail(normalizedEmail);
    if ("error" in foundStudent) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    const hasAccess = await hasStudentAccessToCourse(normalizedEmail, validCourse.data.sessionId);
    if (!hasAccess) {
      return { success: false, error: "Personne non attendue dans ce cours." };
    }

    const nextStep = hasStudentPassword(foundStudent.entity.password) ? "PASSWORD" : "CREATE_PASSWORD";
    return {
      success: true,
      data: {
        nextStep,
        courseName: validCourse.data.courseName,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}

export async function authenticateStudentAction(
  email: string,
  password: string,
  sessionId: string,
  rememberSession: boolean = false
): Promise<ServerActionResult<{ courseName: string }>> {
  try {
    const normalizedEmail = getValidatedStudentEmail(email);
    if (!normalizedEmail || password === "") {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    const validCourse = await getValidCourse(sessionId);
    if (!validCourse.success) {
      return { success: false, error: validCourse.error };
    }

    const foundStudent = await studentQueries.getByEmail(normalizedEmail);
    if ("error" in foundStudent) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    if (foundStudent.entity.password === null) {
      return {
        success: false,
        error: "Vous devez d'abord créer votre mot de passe.",
      };
    }

    const isPasswordValid = await checkPasswordMatch(password, foundStudent.entity.password);
    if (!isPasswordValid) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    const hasAccess = await hasStudentAccessToCourse(normalizedEmail, validCourse.data.sessionId);
    if (!hasAccess) {
      return { success: false, error: "Personne non attendue dans ce cours." };
    }

    const existingAttendance = await db
      .select({ attendanceId: schema.AttendanceTable.table.attendanceId })
      .from(schema.AttendanceTable.table)
      .where(
        and(
          eq(schema.AttendanceTable.table.sessionId, validCourse.data.sessionId),
          eq(schema.AttendanceTable.table.studentMail, normalizedEmail)
        )
      )
      .limit(1);

    if (existingAttendance.length > 0) {
      return { success: false, error: "Vous êtes déjà présent à ce cours." };
    }

    await db.insert(schema.AttendanceTable.table).values({
      sessionId: validCourse.data.sessionId,
      studentMail: normalizedEmail,
      hourDate: new Date(),
    });

    await publishAttendanceRealtimeEvent({
      eventId: crypto.randomUUID(),
      sessionId: validCourse.data.sessionId,
      studentMail: normalizedEmail,
      status: "present",
      source: "student-scan",
      occurredAt: new Date().toISOString(),
    });

    await setStudentSession({
      studentEmail: normalizedEmail,
      isPersistentSession: rememberSession,
    });

    return { success: true, data: { courseName: validCourse.data.courseName } };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}

export async function createStudentPasswordAction(
  email: string,
  password: string,
  confirmPassword: string,
  sessionId: string,
  rememberSession: boolean = false
): Promise<ServerActionResult<{ courseName: string }>> {
  try {
    const normalizedEmail = getValidatedStudentEmail(email);
    if (!normalizedEmail) {
      return { success: false, error: "Compte introuvable." };
    }

    if (!sessionId?.trim()) {
      return { success: false, error: "Aucun cours détecté. Veuillez scanner un QR Code." };
    }

    const foundStudent = await studentQueries.getByEmail(normalizedEmail);
    if ("error" in foundStudent) {
      return { success: false, error: "Compte introuvable." };
    }

    if (hasStudentPassword(foundStudent.entity.password)) {
      return { success: false, error: "Un mot de passe existe déjà pour ce compte." };
    }

    const isPasswordValid = passwordRules.every((rule) => rule.test(password));
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Le mot de passe ne respecte pas les règles de sécurité.",
      };
    }

    if (password !== confirmPassword) {
      return { success: false, error: "Les deux mots de passe ne correspondent pas." };
    }

    const validCourse = await getValidCourse(sessionId);
    if (!validCourse.success) {
      return { success: false, error: validCourse.error };
    }

    const hasAccess = await hasStudentAccessToCourse(normalizedEmail, validCourse.data.sessionId);
    if (!hasAccess) {
      return { success: false, error: "Personne non attendue dans ce cours." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .update(schema.StudentTable.table)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(schema.StudentTable.table.userMail, normalizedEmail));

    await db
      .insert(schema.AttendanceTable.table)
      .values({
        sessionId: validCourse.data.sessionId,
        studentMail: normalizedEmail,
        hourDate: new Date(),
      });

    await publishAttendanceRealtimeEvent({
      eventId: crypto.randomUUID(),
      sessionId: validCourse.data.sessionId,
      studentMail: normalizedEmail,
      status: "present",
      source: "student-scan",
      occurredAt: new Date().toISOString(),
    });

    await setStudentSession({
      studentEmail: normalizedEmail,
      isPersistentSession: rememberSession,
    });

    return { success: true, data: { courseName: validCourse.data.courseName } };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}

export async function autoAttendStudentAction(sessionId: string): Promise<ServerActionResult<{ courseName: string }>> {
  try {
    if (!sessionId?.trim()) {
      return { success: false, error: "Aucun cours détecté. Veuillez scanner un QR Code." };
    }

    const normalizedSessionId = sessionId.trim();

    const session = await getStudentServerSession();
    if (!session?.studentEmail) {
      // No active session - return silent failure so client falls back to email/password form
      return { success: false, error: "" };
    }

    const normalizedEmail = session.studentEmail;

    const validCourse = await getValidCourse(normalizedSessionId);
    if (!validCourse.success) {
      return validCourse;
    }

    const hasAccess = await hasStudentAccessToCourse(normalizedEmail, validCourse.data.sessionId);
    if (!hasAccess) {
      return { success: false, error: "Personne non attendue dans ce cours." };
    }

    const existingAttendance = await db
      .select({ attendanceId: schema.AttendanceTable.table.attendanceId })
      .from(schema.AttendanceTable.table)
      .where(
        and(
          eq(schema.AttendanceTable.table.sessionId, validCourse.data.sessionId),
          eq(schema.AttendanceTable.table.studentMail, normalizedEmail)
        )
      )
      .limit(1);

    if (existingAttendance.length === 0) {
      await db.insert(schema.AttendanceTable.table).values({
        sessionId: validCourse.data.sessionId,
        studentMail: normalizedEmail,
        hourDate: new Date(),
      });

      await publishAttendanceRealtimeEvent({
        eventId: crypto.randomUUID(),
        sessionId: validCourse.data.sessionId,
        studentMail: normalizedEmail,
        status: "present",
        source: "student-scan",
        occurredAt: new Date().toISOString(),
      });
    }

    return { success: true, data: { courseName: validCourse.data.courseName } };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}

export async function getStudentSessionEmailAction() {
  try {
    const session = await getStudentServerSession();
    if (!session?.studentEmail) {
      return { success: false, error: "" };
    }

    return { success: true, data: { studentEmail: session.studentEmail } };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}
