CREATE TABLE `localProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`handle` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` varchar(5000) NOT NULL DEFAULT '',
	`category` enum('كتب','ملابس','أجهزة','متنوعة') NOT NULL,
	`tags` varchar(1000) NOT NULL DEFAULT '',
	`price` decimal(12,2) NOT NULL,
	`currencyCode` varchar(8) NOT NULL DEFAULT 'EGP',
	`inventory` int NOT NULL DEFAULT 0,
	`isAvailable` int NOT NULL DEFAULT 1,
	`imageKey` varchar(512),
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `localProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `localProducts_handle_unique` UNIQUE(`handle`)
);
