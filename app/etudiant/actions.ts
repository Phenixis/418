"use server";

import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import * as schema from "@/lib/db/schema";
import { courseQueries } from "@/lib/db/queries/course";
import { studentQueries } from "@/lib/db/queries/student";
import { passwordRules } from "@/components/login/rules";

type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type CourseData = {
  courseId: string;
  courseName: string;
};

type StudentStepData = {
  nextStep: "PASSWORD" | "CREATE_PASSWORD";
  courseName: string;
};

const DATABASE_CONNECTION_ERROR_MESSAGE =
  "Impossible de contacter la base de données pour le moment. Réessayez dans quelques instants.";

const STUDENT_EMAIL_DOMAIN = "etudiant.univ-rennes.fr";

function getValidatedStudentEmail(email: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const localPartPattern = /^[a-z0-9._-]+$/;

  if (!normalizedEmail.includes("@")) {
    if (!localPartPattern.test(normalizedEmail)) {
      return null;
    }

    return `${normalizedEmail}@${STUDENT_EMAIL_DOMAIN}`;
  }

  const emailParts = normalizedEmail.split("@");
  if (emailParts.length !== 2) {
    return null;
  }

  const [localPart, domainPart] = emailParts;
  if (!localPart || !domainPart) {
    return null;
  }

  if (!localPartPattern.test(localPart)) {
    return null;
  }

  if (domainPart !== STUDENT_EMAIL_DOMAIN) {
    return null;
  }

  return `${localPart}@${domainPart}`;
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

async function checkPasswordMatch(rawPassword: string, storedPassword: string): Promise<boolean> {
  if (!storedPassword.trim()) {
    return false;
  }

  // Bcrypt PHP/MySQL utilise souvent le prefixe $2y$; Node attend $2b$.
  const normalizedHash = storedPassword.startsWith("$2y$")
    ? `$2b$${storedPassword.slice(4)}`
    : storedPassword;

  // Compatibilite: autorise les anciens mots de passe non haches pendant la transition.
  if (!normalizedHash.startsWith("$2")) {
    return rawPassword === normalizedHash;
  }

  return bcrypt.compare(rawPassword, normalizedHash);
}

async function getValidCourse(courseId: string): Promise<ServerActionResult<CourseData>> {
  try {
    const foundCourse = await courseQueries.getByStringId(courseId);
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
    if (normalizedCourseStartAt > now) {
      return { success: false, error: "La connexion à ce cours n'est pas encore ouverte." };
    }

    if (normalizedCourseEndAt < now) {
      return { success: false, error: "La connexion à ce cours est terminée." };
    }

    return {
      success: true,
      data: {
        courseId: course.courseId,
        courseName: course.subject,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}

async function hasStudentAccessToCourse(studentMail: string, courseId: string): Promise<boolean> {
  try {
    const result = await db
      .select({ groupId: schema.StudentTable.table.groupId })
      .from(schema.StudentTable.table)
      .where(eq(schema.StudentTable.table.userMail, studentMail))
      .limit(1);

    if (result.length === 0 || result[0].groupId === null) {
      return false;
    }

    const matchingCourseGroup = await db
      .select({ courseGroupId: schema.CourseGroupTable.table.courseGroupId })
      .from(schema.CourseGroupTable.table)
      .where(
        and(
          eq(schema.CourseGroupTable.table.courseId, courseId),
          eq(schema.CourseGroupTable.table.groupId, result[0].groupId)
        )
      )
      .limit(1);

    return matchingCourseGroup.length > 0;
  } catch (error) {
    throw error;
  }
}

export async function getCourseStatusAction(courseId: string): Promise<ServerActionResult<CourseData>> {
  if (!courseId?.trim()) {
    return { success: false, error: "Aucun cours détecté. Veuillez scanner un QR Code." };
  }

  return getValidCourse(courseId.trim());
}

export async function checkStudentEmailAction(
  email: string,
  courseId: string
): Promise<ServerActionResult<StudentStepData>> {
  try {
    const normalizedEmail = getValidatedStudentEmail(email);
    if (!normalizedEmail) {
      return {
        success: false,
        error: "Veuillez entrer une adresse email étudiante valide.",
      };
    }

    const validCourse = await getValidCourse(courseId);
    if (!validCourse.success) {
      return validCourse;
    }

    const foundStudent = await studentQueries.getByEmail(normalizedEmail);
    if ("error" in foundStudent) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    const hasAccess = await hasStudentAccessToCourse(normalizedEmail, validCourse.data.courseId);
    if (!hasAccess) {
      return { success: false, error: "Personne non attendue dans ce cours." };
    }

    const nextStep = foundStudent.entity.password.trim() === "" ? "CREATE_PASSWORD" : "PASSWORD";
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
  courseId: string
): Promise<ServerActionResult<{ courseName: string; alreadyPresent?: boolean }>> {
  try {
    const normalizedEmail = getValidatedStudentEmail(email);
    if (!normalizedEmail || !password.trim()) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    const validCourse = await getValidCourse(courseId);
    if (!validCourse.success) {
      return validCourse;
    }

    const foundStudent = await studentQueries.getByEmail(normalizedEmail);
    if ("error" in foundStudent) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    const isPasswordValid = await checkPasswordMatch(password, foundStudent.entity.password);
    if (!isPasswordValid) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    const hasAccess = await hasStudentAccessToCourse(normalizedEmail, validCourse.data.courseId);
    if (!hasAccess) {
      return { success: false, error: "Personne non attendue dans ce cours." };
    }

    const existingAttendance = await db
      .select({ attendanceId: schema.AttendanceTable.table.attendanceId })
      .from(schema.AttendanceTable.table)
      .where(
        and(
          eq(schema.AttendanceTable.table.courseId, validCourse.data.courseId),
          eq(schema.AttendanceTable.table.studentMail, normalizedEmail)
        )
      )
      .limit(1);

    if (existingAttendance.length > 0) {
      return { success: true, data: { courseName: validCourse.data.courseName, alreadyPresent: true } };
    }

    await db.insert(schema.AttendanceTable.table).values({
      courseId: validCourse.data.courseId,
      studentMail: normalizedEmail,
      hourDate: new Date(),
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
  courseId: string
): Promise<ServerActionResult<{ courseName: string }>> {
  try {
    const normalizedEmail = getValidatedStudentEmail(email);
    if (!normalizedEmail) {
      return { success: false, error: "Compte introuvable." };
    }

    const foundStudent = await studentQueries.getByEmail(normalizedEmail);
    if ("error" in foundStudent) {
      return { success: false, error: "Compte introuvable." };
    }

    if (foundStudent.entity.password.trim() !== "") {
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

    const validCourse = await getValidCourse(courseId);
    if (!validCourse.success) {
      return validCourse;
    }

    const hasAccess = await hasStudentAccessToCourse(normalizedEmail, validCourse.data.courseId);
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
        courseId: validCourse.data.courseId,
        studentMail: normalizedEmail,
        hourDate: new Date(),
      })
      .onConflictDoNothing({
        target: [
          schema.AttendanceTable.table.courseId,
          schema.AttendanceTable.table.studentMail,
        ],
      });

    return { success: true, data: { courseName: validCourse.data.courseName } };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}
