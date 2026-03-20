CREATE TABLE IF NOT EXISTS "course_group" (
	"course_group_id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar(10) NOT NULL,
	"group_id" varchar(60) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_teacher" (
	"course_teacher_id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar(10) NOT NULL,
	"teacher_mail" varchar(60) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student" RENAME COLUMN "isTeacher" TO "is_teacher";--> statement-breakpoint
ALTER TABLE "teacher" RENAME COLUMN "isTeacher" TO "is_teacher";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_group" ADD CONSTRAINT "course_group_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_group" ADD CONSTRAINT "course_group_group_id_group_groupId_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("groupId") ON DELETE no action ON UPDATE no action;
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
