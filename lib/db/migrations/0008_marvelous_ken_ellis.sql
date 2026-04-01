ALTER TABLE "student" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "late_status" integer DEFAULT 0 NOT NULL;