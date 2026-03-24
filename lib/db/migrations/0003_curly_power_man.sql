ALTER TABLE "attendance" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "course_group" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "course_group" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "course_group" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "course_teacher" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "course_teacher" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "course_teacher" ADD COLUMN "deleted_at" timestamp;