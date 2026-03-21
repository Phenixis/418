CREATE TABLE IF NOT EXISTS "attendance" (
	"attendance_id" serial PRIMARY KEY NOT NULL,
	"hour_date" timestamp,
	"course_id" varchar(10) NOT NULL,
	"student_mail" varchar(60) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_group" (
	"course_group_id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar(10) NOT NULL,
	"group_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_teacher" (
	"course_teacher_id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar(10) NOT NULL,
	"teacher_mail" varchar(60) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"course_id" varchar(10) PRIMARY KEY NOT NULL,
	"hours" time NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"subject" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"group_id" serial PRIMARY KEY NOT NULL,
	"promo" char(1) NOT NULL,
	"td" char(1) NOT NULL,
	"tp" char(1) NOT NULL,
	"department" varchar(10) NOT NULL,
	"code_path" varchar(10) NOT NULL,
	"description_path" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student" (
	"user_mail" varchar(60) PRIMARY KEY NOT NULL,
	"last_name" varchar(30) NOT NULL,
	"first_name" varchar(30) NOT NULL,
	"password" varchar(100) NOT NULL,
	"is_teacher" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"picture" text,
	"group_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teacher" (
	"user_mail" varchar(60) PRIMARY KEY NOT NULL,
	"last_name" varchar(30) NOT NULL,
	"first_name" varchar(30) NOT NULL,
	"password" varchar(100) NOT NULL,
	"is_teacher" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_mail_student_user_mail_fk" FOREIGN KEY ("student_mail") REFERENCES "public"."student"("user_mail") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_group" ADD CONSTRAINT "course_group_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_group" ADD CONSTRAINT "course_group_group_id_group_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("group_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_teacher" ADD CONSTRAINT "course_teacher_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_teacher" ADD CONSTRAINT "course_teacher_teacher_mail_teacher_user_mail_fk" FOREIGN KEY ("teacher_mail") REFERENCES "public"."teacher"("user_mail") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student" ADD CONSTRAINT "student_group_id_group_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("group_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
