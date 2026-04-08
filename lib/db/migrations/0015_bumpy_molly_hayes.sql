ALTER TABLE "resource" ADD COLUMN "source" varchar(10);--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "source" varchar(10);--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ade_uid" varchar(255);--> statement-breakpoint
ALTER TABLE "teacher" ADD COLUMN "ical_url" varchar(500);