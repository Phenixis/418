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
CREATE TABLE "session_tag" (
	"session_tag_id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(36) NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "student_tag" (
	"student_tag_id" serial PRIMARY KEY NOT NULL,
	"tag_id" integer NOT NULL,
	"student_mail" varchar(60) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"tag_id" serial PRIMARY KEY NOT NULL,
	"teacher_mail" varchar(60) NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "resource" ADD COLUMN "source" varchar(10);--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "manual_call_start_at" timestamp;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "manual_call_end_at" timestamp;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "source" varchar(10);--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ade_uid" varchar(255);--> statement-breakpoint
ALTER TABLE "teacher" ADD COLUMN "is_first_connection" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher" ADD COLUMN "ical_url" varchar(500);--> statement-breakpoint
ALTER TABLE "annotation" ADD CONSTRAINT "annotation_teacher_email_teacher_user_mail_fk" FOREIGN KEY ("teacher_email") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "annotation" ADD CONSTRAINT "annotation_student_email_student_user_mail_fk" FOREIGN KEY ("student_email") REFERENCES "public"."student"("user_mail") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session_tag" ADD CONSTRAINT "session_tag_session_id_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("session_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session_tag" ADD CONSTRAINT "session_tag_tag_id_tag_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("tag_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_tag" ADD CONSTRAINT "student_tag_tag_id_tag_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("tag_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_tag" ADD CONSTRAINT "student_tag_student_mail_student_user_mail_fk" FOREIGN KEY ("student_mail") REFERENCES "public"."student"("user_mail") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_teacher_mail_teacher_user_mail_fk" FOREIGN KEY ("teacher_mail") REFERENCES "public"."teacher"("user_mail") ON DELETE cascade ON UPDATE cascade;