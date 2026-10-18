ALTER TABLE `gift_orders` ADD `plan` text;--> statement-breakpoint
ALTER TABLE `gift_orders` ADD `plan_name` text;--> statement-breakpoint
ALTER TABLE `gift_orders` ADD `book_credit` integer DEFAULT 0 NOT NULL;