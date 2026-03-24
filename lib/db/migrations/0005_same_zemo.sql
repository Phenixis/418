ALTER TABLE "attendance" ALTER COLUMN "course_id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "course_group" ALTER COLUMN "course_id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "course_teacher" ALTER COLUMN "course_id" SET DATA TYPE varchar(36);