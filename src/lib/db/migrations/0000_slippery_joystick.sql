CREATE TABLE `analytics_summary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`short_url_id` integer NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`period_type` text NOT NULL,
	`total_clicks` integer DEFAULT 0 NOT NULL,
	`clicks_by_device` text,
	`clicks_by_referrer` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`short_url_id`) REFERENCES `short_urls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_summary_unique_period` ON `analytics_summary` (`short_url_id`,`period_start`,`period_type`);--> statement-breakpoint
CREATE INDEX `analytics_summary_period_type_idx` ON `analytics_summary` (`period_type`);--> statement-breakpoint
CREATE TABLE `click_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`short_url_id` integer NOT NULL,
	`timestamp` text NOT NULL,
	`referrer` text,
	`user_agent` text,
	`device_type` text,
	`ip_address` text,
	FOREIGN KEY (`short_url_id`) REFERENCES `short_urls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `click_events_short_url_idx` ON `click_events` (`short_url_id`);--> statement-breakpoint
CREATE INDEX `click_events_timeseries_idx` ON `click_events` (`short_url_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `short_urls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`original_url` text NOT NULL,
	`analytics_token` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `short_urls_slug_unique` ON `short_urls` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `short_urls_analytics_token_unique` ON `short_urls` (`analytics_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `slug_idx` ON `short_urls` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_token_idx` ON `short_urls` (`analytics_token`);