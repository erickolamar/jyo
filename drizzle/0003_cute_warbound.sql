ALTER TABLE `contents` ADD `free_pages` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `contents` ADD `section_kind` text DEFAULT 'CHAPTER' NOT NULL;