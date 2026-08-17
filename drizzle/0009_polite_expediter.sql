CREATE TABLE `wishlistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` enum('منتج','كتاب رقمي') NOT NULL,
	`itemId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255) NOT NULL DEFAULT '',
	`price` decimal(12,2) NOT NULL DEFAULT '0.00',
	`currencyCode` varchar(8) NOT NULL DEFAULT 'EGP',
	`imageUrl` text,
	`targetPath` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlistItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlist_user_item_unique` UNIQUE(`userId`,`itemType`,`itemId`)
);
--> statement-breakpoint
ALTER TABLE `wishlistItems` ADD CONSTRAINT `wishlistItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;