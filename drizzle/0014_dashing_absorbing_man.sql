CREATE TABLE `digitalBookDownloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`digitalBookId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `digitalBookDownloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `maxDownloads` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBookDownloads` ADD CONSTRAINT `digitalBookDownloads_digitalBookId_digitalBooks_id_fk` FOREIGN KEY (`digitalBookId`) REFERENCES `digitalBooks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `digitalBookDownloads` ADD CONSTRAINT `digitalBookDownloads_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `digitalBookDownloads_user_book_idx` ON `digitalBookDownloads` (`userId`,`digitalBookId`);--> statement-breakpoint
CREATE INDEX `digitalBookDownloads_createdAt_idx` ON `digitalBookDownloads` (`createdAt`);