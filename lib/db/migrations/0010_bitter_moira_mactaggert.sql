CREATE TABLE IF NOT EXISTS "reset_password_session" (
	"session_id" varchar(36) PRIMARY KEY NOT NULL,
	"user_mail_student" varchar(60),
	"user_mail_teacher" varchar(60),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reset_password_session" ADD CONSTRAINT "reset_password_session_user_mail_student_student_user_mail_fk" FOREIGN KEY ("user_mail_student") REFERENCES "public"."student"("user_mail") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reset_password_session" ADD CONSTRAINT "reset_password_session_user_mail_teacher_teacher_user_mail_fk" FOREIGN KEY ("user_mail_teacher") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
