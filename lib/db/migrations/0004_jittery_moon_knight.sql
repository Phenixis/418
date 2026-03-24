ALTER TABLE "attendance" DROP CONSTRAINT "attendance_course_id_course_course_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_student_mail_student_user_mail_fk";
--> statement-breakpoint
ALTER TABLE "course_group" DROP CONSTRAINT "course_group_course_id_course_course_id_fk";
--> statement-breakpoint
ALTER TABLE "course_group" DROP CONSTRAINT "course_group_group_id_group_group_id_fk";
--> statement-breakpoint
ALTER TABLE "course_teacher" DROP CONSTRAINT "course_teacher_course_id_course_course_id_fk";
--> statement-breakpoint
ALTER TABLE "course_teacher" DROP CONSTRAINT "course_teacher_teacher_mail_teacher_user_mail_fk";
--> statement-breakpoint
ALTER TABLE "student" DROP CONSTRAINT "student_group_id_group_group_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_mail_student_user_mail_fk" FOREIGN KEY ("student_mail") REFERENCES "public"."student"("user_mail") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_group" ADD CONSTRAINT "course_group_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_group" ADD CONSTRAINT "course_group_group_id_group_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("group_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_teacher" ADD CONSTRAINT "course_teacher_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_teacher" ADD CONSTRAINT "course_teacher_teacher_mail_teacher_user_mail_fk" FOREIGN KEY ("teacher_mail") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student" ADD CONSTRAINT "student_group_id_group_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("group_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
