CREATE TABLE "annotation" (
	"annotation_id" serial PRIMARY KEY NOT NULL,
	"teacher_email" varchar(60) NOT NULL,
	"student_email" varchar(60) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "annotation" ADD CONSTRAINT "annotation_teacher_email_teacher_user_mail_fk" FOREIGN KEY ("teacher_email") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "annotation" ADD CONSTRAINT "annotation_student_email_student_user_mail_fk" FOREIGN KEY ("student_email") REFERENCES "public"."student"("user_mail") ON DELETE cascade ON UPDATE cascade;