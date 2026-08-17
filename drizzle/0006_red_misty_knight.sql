ALTER TABLE `digitalBooks` ADD `description` varchar(5000) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `price` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `currencyCode` varchar(8) DEFAULT 'EGP' NOT NULL;--> statement-breakpoint
ALTER TABLE `digitalBooks` ADD `isAvailable` int DEFAULT 1 NOT NULL;
