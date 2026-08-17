CREATE TABLE `customerAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(80) NOT NULL DEFAULT 'عنوان',
	`recipientName` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`country` varchar(96) NOT NULL,
	`city` varchar(96) NOT NULL,
	`address` text NOT NULL,
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discountCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`discountType` enum('نسبة','مبلغ ثابت') NOT NULL,
	`value` decimal(12,2) NOT NULL,
	`minimumAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`maxUses` int NOT NULL DEFAULT 0,
	`usedCount` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discountCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `discountCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `shippingZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(96) NOT NULL,
	`label` varchar(160) NOT NULL,
	`amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`currencyCode` varchar(8) NOT NULL DEFAULT 'EGP',
	`estimatedDays` varchar(80) NOT NULL DEFAULT 'يُحدّد عند تأكيد الطلب',
	`isActive` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shippingZones_id` PRIMARY KEY(`id`),
	CONSTRAINT `shippingZones_city_unique` UNIQUE(`city`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `subtotal` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `discountAmount` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingAmount` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `couponCode` varchar(64);--> statement-breakpoint
ALTER TABLE `customerAddresses` ADD CONSTRAINT `customerAddresses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;