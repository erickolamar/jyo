CREATE TABLE `gift_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_user_id` text NOT NULL,
	`source` text NOT NULL,
	`gift_type` text NOT NULL,
	`work_id` text,
	`days` integer,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`total_price` integer NOT NULL,
	`payment_id` text,
	`status` text NOT NULL,
	`sender_display_name` text NOT NULL,
	`default_message` text NOT NULL,
	`card_style` text,
	`recipients` text NOT NULL,
	`activation_days` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `gift_orders_buyer` ON `gift_orders` (`buyer_user_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `gift_order_payment` ON `gift_orders` (`payment_id`);--> statement-breakpoint
CREATE TABLE `gift_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`gift_order_id` text NOT NULL,
	`slot` integer NOT NULL,
	`token_hash` text NOT NULL,
	`token_cipher` text NOT NULL,
	`display_code` text NOT NULL,
	`status` text NOT NULL,
	`recipient_name` text NOT NULL,
	`message` text NOT NULL,
	`expires_at` integer,
	`claimed_by_user_id` text,
	`claimed_at` integer,
	`valid_until` integer,
	`sent_at` integer,
	`thank_message` text,
	`thanked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`gift_order_id`) REFERENCES `gift_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_slot` ON `gift_tokens` (`gift_order_id`,`slot`);--> statement-breakpoint
CREATE UNIQUE INDEX `gift_token_hash` ON `gift_tokens` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `gift_display_code` ON `gift_tokens` (`display_code`);