CREATE TABLE `entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`work_id` text,
	`access_scope` text NOT NULL,
	`valid_from` integer NOT NULL,
	`valid_until` integer,
	`source` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entitlement_user_work` ON `entitlements` (`user_id`,`work_id`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`anonymous_id` text,
	`work_id` text,
	`content_id` text,
	`event` text NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `event_work_date` ON `analytics_events` (`work_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`work_id` text NOT NULL,
	`start_date` integer NOT NULL,
	`target_date` integer NOT NULL,
	`start_progress` real NOT NULL,
	`current_progress` real NOT NULL,
	`reminder_enabled` integer DEFAULT 0 NOT NULL,
	`reminder_time` text DEFAULT '19:00' NOT NULL,
	`preferred_days` text DEFAULT '[1,2,3,4,5,6,0]' NOT NULL,
	`timezone` text DEFAULT 'Africa/Douala' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goal_user_work` ON `user_goals` (`user_id`,`work_id`);--> statement-breakpoint
CREATE TABLE `format_segment_mapping` (
	`id` text PRIMARY KEY NOT NULL,
	`segment_id` text NOT NULL,
	`content_id` text NOT NULL,
	`start_position` real DEFAULT 0 NOT NULL,
	`end_position` real
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mapping_content` ON `format_segment_mapping` (`content_id`);--> statement-breakpoint
CREATE TABLE `goal_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`day` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_goal_day` ON `goal_reminders` (`goal_id`,`day`);--> statement-breakpoint
CREATE TABLE `saved_works` (
	`user_id` text NOT NULL,
	`work_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `work_id`)
);
--> statement-breakpoint
CREATE TABLE `work_segments` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`start_progress` real NOT NULL,
	`end_progress` real NOT NULL,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_user_id` text NOT NULL,
	`work_id` text NOT NULL,
	`content_id` text,
	`share_type` text NOT NULL,
	`text_content` text DEFAULT '' NOT NULL,
	`media_key` text,
	`start_position` real,
	`end_position` real,
	`public_slug` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_public_slug_unique` ON `shares` (`public_slug`);--> statement-breakpoint
CREATE TABLE `source_files` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`file_type` text DEFAULT 'PDF' NOT NULL,
	`original_filename` text NOT NULL,
	`storage_url` text NOT NULL,
	`file_hash` text NOT NULL,
	`page_count` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`analysis` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `source_work` ON `source_files` (`work_id`);--> statement-breakpoint
CREATE TABLE `work_formats` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`type` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_formats_work_type` ON `work_formats` (`work_id`,`type`);--> statement-breakpoint
ALTER TABLE `contents` ADD `format_id` text;--> statement-breakpoint
ALTER TABLE `contents` ADD `source_id` text;--> statement-breakpoint
ALTER TABLE `contents` ADD `source_version` integer;--> statement-breakpoint
ALTER TABLE `contents` ADD `start_page` integer;--> statement-breakpoint
ALTER TABLE `contents` ADD `end_page` integer;--> statement-breakpoint
ALTER TABLE `contents` ADD `canonical_start` real;--> statement-breakpoint
ALTER TABLE `contents` ADD `canonical_end` real;--> statement-breakpoint
ALTER TABLE `contents` ADD `split_mode` text DEFAULT 'WHOLE' NOT NULL;--> statement-breakpoint
ALTER TABLE `contents` ADD `sharing_allowed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `contents` ADD `share_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contents` ADD `share_media_key` text;--> statement-breakpoint
ALTER TABLE `contents` ADD `share_duration` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `contents` ADD `subtitle_key` text;--> statement-breakpoint
ALTER TABLE `contents` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `contents` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `work_id` text;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `format_id` text;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `canonical_progress` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `page_number` integer;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `scroll_ratio` real;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `text_anchor` text;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `character_offset` integer;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `timestamp_seconds` real;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `source_version` integer;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `automatic_position` text;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `manual_resume_position` text;--> statement-breakpoint
ALTER TABLE `works` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `works` ADD `hero_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `works` ADD `trailer_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `works` ADD `categories` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `works` ADD `updated_at` integer;