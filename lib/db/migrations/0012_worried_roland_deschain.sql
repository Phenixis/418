CREATE TABLE IF NOT EXISTS "session_teacher" (
	"session_teacher_id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(36) NOT NULL,
	"teacher_mail" varchar(60) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"session_id" varchar(36) PRIMARY KEY NOT NULL,
	"resource_id" varchar(36) NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"subject" varchar(50) NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
	IF to_regclass('public.course_teacher') IS NOT NULL AND to_regclass('public.resource_teacher') IS NULL THEN
		ALTER TABLE "course_teacher" RENAME TO "resource_teacher";
	END IF;

	IF to_regclass('public.course') IS NOT NULL AND to_regclass('public.resource') IS NULL THEN
		ALTER TABLE "course" RENAME TO "resource";
	END IF;

	IF to_regclass('public.course_group') IS NOT NULL AND to_regclass('public.session_group') IS NULL THEN
		ALTER TABLE "course_group" RENAME TO "session_group";
	END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'course_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'session_id'
	) THEN
		ALTER TABLE "attendance" RENAME COLUMN "course_id" TO "session_id";
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'session_group' AND column_name = 'course_group_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'session_group' AND column_name = 'session_group_id'
	) THEN
		ALTER TABLE "session_group" RENAME COLUMN "course_group_id" TO "session_group_id";
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'session_group' AND column_name = 'course_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'session_group' AND column_name = 'session_id'
	) THEN
		ALTER TABLE "session_group" RENAME COLUMN "course_id" TO "session_id";
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'resource_teacher' AND column_name = 'course_teacher_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'resource_teacher' AND column_name = 'resource_teacher_id'
	) THEN
		ALTER TABLE "resource_teacher" RENAME COLUMN "course_teacher_id" TO "resource_teacher_id";
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'resource_teacher' AND column_name = 'course_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'resource_teacher' AND column_name = 'resource_id'
	) THEN
		ALTER TABLE "resource_teacher" RENAME COLUMN "course_id" TO "resource_id";
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'resource' AND column_name = 'course_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'resource' AND column_name = 'resource_id'
	) THEN
		ALTER TABLE "resource" RENAME COLUMN "course_id" TO "resource_id";
	END IF;
END $$;
--> statement-breakpoint

ALTER TABLE IF EXISTS "attendance" DROP CONSTRAINT IF EXISTS "attendance_course_id_course_course_id_fk";
--> statement-breakpoint
ALTER TABLE IF EXISTS "session_group" DROP CONSTRAINT IF EXISTS "course_group_course_id_course_course_id_fk";
--> statement-breakpoint
ALTER TABLE IF EXISTS "session_group" DROP CONSTRAINT IF EXISTS "course_group_group_id_group_group_id_fk";
--> statement-breakpoint
ALTER TABLE IF EXISTS "resource_teacher" DROP CONSTRAINT IF EXISTS "course_teacher_course_id_course_course_id_fk";
--> statement-breakpoint
ALTER TABLE IF EXISTS "resource_teacher" DROP CONSTRAINT IF EXISTS "course_teacher_teacher_mail_teacher_user_mail_fk";
--> statement-breakpoint

-- Backfill: 1 legacy course/resource becomes 1 session.
DO $$
BEGIN
	IF to_regclass('public.resource') IS NOT NULL
		AND EXISTS (
			SELECT 1 FROM information_schema.columns
			WHERE table_schema = 'public' AND table_name = 'resource' AND column_name = 'start_at'
		)
	THEN
		INSERT INTO "session" ("session_id", "resource_id", "start_at", "end_at", "subject", "created_at", "updated_at", "deleted_at")
		SELECT "resource_id", "resource_id", "start_at", "end_at", "subject", "created_at", "updated_at", "deleted_at"
		FROM "resource"
		ON CONFLICT ("session_id") DO NOTHING;
	END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
	IF to_regclass('public.resource_teacher') IS NOT NULL THEN
		INSERT INTO "session_teacher" ("session_id", "teacher_mail", "created_at", "updated_at", "deleted_at")
		SELECT rt."resource_id", rt."teacher_mail", rt."created_at", rt."updated_at", rt."deleted_at"
		FROM "resource_teacher" rt
		WHERE NOT EXISTS (
			SELECT 1
			FROM "session_teacher" st
			WHERE st."session_id" = rt."resource_id"
				AND st."teacher_mail" = rt."teacher_mail"
		);
	END IF;
END $$;
--> statement-breakpoint

-- Defensive cleanup for orphan references before adding FK constraints.
DELETE FROM "attendance"
WHERE NOT EXISTS (
	SELECT 1
	FROM "session"
	WHERE "session"."session_id" = "attendance"."session_id"
);
--> statement-breakpoint
DELETE FROM "session_group"
WHERE NOT EXISTS (
	SELECT 1
	FROM "session"
	WHERE "session"."session_id" = "session_group"."session_id"
);
--> statement-breakpoint
DELETE FROM "session_teacher"
WHERE NOT EXISTS (
	SELECT 1
	FROM "session"
	WHERE "session"."session_id" = "session_teacher"."session_id"
);
--> statement-breakpoint

DO $$
BEGIN
	IF to_regclass('public.session_teacher') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_teacher_session_id_session_session_id_fk')
	THEN
		ALTER TABLE "session_teacher" ADD CONSTRAINT "session_teacher_session_id_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("session_id") ON DELETE cascade ON UPDATE cascade;
	END IF;

	IF to_regclass('public.session_teacher') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_teacher_teacher_mail_teacher_user_mail_fk')
	THEN
		ALTER TABLE "session_teacher" ADD CONSTRAINT "session_teacher_teacher_mail_teacher_user_mail_fk" FOREIGN KEY ("teacher_mail") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;
	END IF;

	IF to_regclass('public.session') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_resource_id_resource_resource_id_fk')
	THEN
		ALTER TABLE "session" ADD CONSTRAINT "session_resource_id_resource_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("resource_id") ON DELETE cascade ON UPDATE cascade;
	END IF;

	IF to_regclass('public.attendance') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_session_id_session_session_id_fk')
	THEN
		ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("session_id") ON DELETE cascade ON UPDATE cascade;
	END IF;

	IF to_regclass('public.session_group') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_group_session_id_session_session_id_fk')
	THEN
		ALTER TABLE "session_group" ADD CONSTRAINT "session_group_session_id_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("session_id") ON DELETE cascade ON UPDATE cascade;
	END IF;

	IF to_regclass('public.session_group') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_group_group_id_group_group_id_fk')
	THEN
		ALTER TABLE "session_group" ADD CONSTRAINT "session_group_group_id_group_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("group_id") ON DELETE cascade ON UPDATE cascade;
	END IF;

	IF to_regclass('public.resource_teacher') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resource_teacher_resource_id_resource_resource_id_fk')
	THEN
		ALTER TABLE "resource_teacher" ADD CONSTRAINT "resource_teacher_resource_id_resource_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("resource_id") ON DELETE cascade ON UPDATE cascade;
	END IF;

	IF to_regclass('public.resource_teacher') IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resource_teacher_teacher_mail_teacher_user_mail_fk')
	THEN
		ALTER TABLE "resource_teacher" ADD CONSTRAINT "resource_teacher_teacher_mail_teacher_user_mail_fk" FOREIGN KEY ("teacher_mail") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;
	END IF;
END $$;
--> statement-breakpoint

ALTER TABLE IF EXISTS "resource" DROP COLUMN IF EXISTS "start_at";
--> statement-breakpoint
ALTER TABLE IF EXISTS "resource" DROP COLUMN IF EXISTS "end_at";