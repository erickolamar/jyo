CREATE TABLE `reading_daily` (
	`user_id` text NOT NULL,
	`work_id` text NOT NULL,
	`day` text NOT NULL,
	`format` text NOT NULL,
	`gain` real DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `work_id`, `day`, `format`)
);
--> statement-breakpoint
CREATE TABLE `platform_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`started_at` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`last_view` text NOT NULL,
	`views` integer DEFAULT 1 NOT NULL,
	`work_id` text,
	`format` text
);
--> statement-breakpoint
CREATE INDEX `visits_seen` ON `platform_visits` (`last_seen`);--> statement-breakpoint
CREATE INDEX `visits_started` ON `platform_visits` (`started_at`);--> statement-breakpoint
ALTER TABLE `user_progress` ADD `furthest_percentage` real DEFAULT 0 NOT NULL;