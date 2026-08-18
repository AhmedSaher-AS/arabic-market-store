CREATE TABLE `digitalBookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`digitalBookId` int NOT NULL,
	`userId` int,
	`eventType` enum('عرض','بدء طلب','سداد معتمد') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `digitalBookEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `shortDescription` varchar(600) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `author` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `language` varchar(64) DEFAULT 'العربية' NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `pageCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `category` varchar(120) DEFAULT 'عام' NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `tags` varchar(1000) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `tableOfContents` text;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `sampleKey` varchar(512);--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `sampleUrl` text;--> statement-breakpoint
ALTER TABLE `digitalBookEvents` ADD CONSTRAINT `digitalBookEvents_digitalBookId_digitalBooks_id_fk` FOREIGN KEY (`digitalBookId`) REFERENCES `digitalBooks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `digitalBookEvents` ADD CONSTRAINT `digitalBookEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;