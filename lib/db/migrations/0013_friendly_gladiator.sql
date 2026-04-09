CREATE TABLE IF NOT EXISTS "annotation" (
	"annotation_id" serial PRIMARY KEY NOT NULL,
	"teacher_email" varchar(60) NOT NULL,
	"student_email" varchar(60) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_tag" (
	"session_tag_id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(36) NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_tag" (
	"student_tag_id" serial PRIMARY KEY NOT NULL,
	"tag_id" integer NOT NULL,
	"student_mail" varchar(60) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag" (
	"tag_id" serial PRIMARY KEY NOT NULL,
	"teacher_mail" varchar(60) NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "resource" ADD COLUMN IF NOT EXISTS "source" varchar(10);--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "manual_call_start_at" timestamp;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "manual_call_end_at" timestamp;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "source" varchar(10);--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "ade_uid" varchar(255);--> statement-breakpoint
ALTER TABLE "teacher" ADD COLUMN IF NOT EXISTS "is_first_connection" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher" ADD COLUMN IF NOT EXISTS "ical_url" varchar(500);--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'annotation_teacher_email_teacher_user_mail_fk'
	) THEN
		ALTER TABLE "annotation" ADD CONSTRAINT "annotation_teacher_email_teacher_user_mail_fk" FOREIGN KEY ("teacher_email") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'annotation_student_email_student_user_mail_fk'
	) THEN
		ALTER TABLE "annotation" ADD CONSTRAINT "annotation_student_email_student_user_mail_fk" FOREIGN KEY ("student_email") REFERENCES "public"."student"("user_mail") ON DELETE cascade ON UPDATE cascade;
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'session_tag_session_id_session_session_id_fk'
	) THEN
		ALTER TABLE "session_tag" ADD CONSTRAINT "session_tag_session_id_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("session_id") ON DELETE cascade ON UPDATE cascade;
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'session_tag_tag_id_tag_tag_id_fk'
	) THEN
		ALTER TABLE "session_tag" ADD CONSTRAINT "session_tag_tag_id_tag_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("tag_id") ON DELETE cascade ON UPDATE cascade;
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'student_tag_tag_id_tag_tag_id_fk'
	) THEN
		ALTER TABLE "student_tag" ADD CONSTRAINT "student_tag_tag_id_tag_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("tag_id") ON DELETE cascade ON UPDATE cascade;
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'student_tag_student_mail_student_user_mail_fk'
	) THEN
		ALTER TABLE "student_tag" ADD CONSTRAINT "student_tag_student_mail_student_user_mail_fk" FOREIGN KEY ("student_mail") REFERENCES "public"."student"("user_mail") ON DELETE cascade ON UPDATE cascade;
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'tag_teacher_mail_teacher_user_mail_fk'
	) THEN
		ALTER TABLE "tag" ADD CONSTRAINT "tag_teacher_mail_teacher_user_mail_fk" FOREIGN KEY ("teacher_mail") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;
	END IF;
END
$$;