CREATE TABLE `readingProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`digitalBookId` int NOT NULL,
	`lastPage` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `readingProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `readingProgress_user_book_unique` UNIQUE(`userId`,`digitalBookId`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `paymentMethod` enum('فودافون كاش','فوري','واتساب','إنستا باي','فيزا/ماستركارد','PayPal') NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentSettings` ADD `whatsappNumber` varchar(32) DEFAULT '201146303129' NOT NULL;--> statement-breakpoint
ALTER TABLE `readingProgress` ADD CONSTRAINT `readingProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `readingProgress` ADD CONSTRAINT `readingProgress_digitalBookId_digitalBooks_id_fk` FOREIGN KEY (`digitalBookId`) REFERENCES `digitalBooks`(`id`) ON DELETE no action ON UPDATE no action;