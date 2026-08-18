CREATE TABLE `digitalBookReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`digitalBookId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(160) NOT NULL DEFAULT '',
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `digitalBookReviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `digitalBookReviews_user_book_unique` UNIQUE(`userId`,`digitalBookId`)
);
--> statement-breakpoint
ALTER TABLE `digitalBookReviews` ADD CONSTRAINT `digitalBookReviews_digitalBookId_digitalBooks_id_fk` FOREIGN KEY (`digitalBookId`) REFERENCES `digitalBooks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `digitalBookReviews` ADD CONSTRAINT `digitalBookReviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;