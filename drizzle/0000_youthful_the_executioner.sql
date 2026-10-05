CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contents` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`format` text NOT NULL,
	`sequence` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`access_type` text DEFAULT 'FREE' NOT NULL,
	`text_content` text DEFAULT '' NOT NULL,
	`preview_text` text DEFAULT '' NOT NULL,
	`media_key` text,
	`preview_key` text,
	`duration` integer DEFAULT 0 NOT NULL,
	`download_allowed` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`publish_at` integer,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contents_work_format_sequence` ON `contents` (`work_id`,`format`,`sequence`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`reference` text NOT NULL,
	`phone` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`return_to` text NOT NULL,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	`reviewed_by` text,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_reference` ON `payments` (`provider`,`reference`);--> statement-breakpoint
CREATE INDEX `payments_user_created` ON `payments` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_progress` (
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`position` real NOT NULL,
	`percentage` real NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `content_id`),
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `progress_user_updated` ON `user_progress` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`ends_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`subtitle` text NOT NULL,
	`synopsis` text NOT NULL,
	`cover` text DEFAULT '/hero.png' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`publish_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `works_slug_unique` ON `works` (`slug`);