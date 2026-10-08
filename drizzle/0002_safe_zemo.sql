CREATE TABLE `reader_annotations` (
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`annotations` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `content_id`)
);
--> statement-breakpoint
CREATE TABLE `reader_documents` (
	`owner` text PRIMARY KEY NOT NULL,
	`book_key` text,
	`characters_per_page` integer DEFAULT 1800 NOT NULL,
	`pdf_download` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
