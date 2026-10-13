CREATE TABLE `reading_commitments` (
	`user_id` text PRIMARY KEY NOT NULL,
	`minutes` integer NOT NULL,
	`period` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reading_legacy_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reading_time_badges` (
	`user_id` text NOT NULL,
	`badge` text NOT NULL,
	`earned_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `badge`)
);
--> statement-breakpoint
CREATE TABLE `reading_time_manual` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`day` text NOT NULL,
	`seconds` integer NOT NULL,
	`book_key` text NOT NULL,
	`title` text NOT NULL,
	`format` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `reading_time_slots` (
	`user_id` text NOT NULL,
	`minute` integer NOT NULL,
	`book_key` text NOT NULL,
	`title` text NOT NULL,
	`format` text NOT NULL,
	`mask` text NOT NULL,
	PRIMARY KEY(`user_id`, `minute`, `book_key`, `format`)
);

--> statement-breakpoint
INSERT OR IGNORE INTO reading_legacy_goals(id,until) SELECT id,target_date FROM user_goals WHERE status IN ('ACTIVE','PAUSED') AND target_date>CAST(strftime('%s','now') AS INTEGER)*1000;
