CREATE TABLE `digitalBooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productHandle` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`pdfKey` varchar(512) NOT NULL,
	`pdfUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `digitalBooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `digitalBooks_productHandle_unique` UNIQUE(`productHandle`)
);
--> statement-breakpoint
CREATE TABLE `digitalEntitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`digitalBookId` int NOT NULL,
	`orderId` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `digitalEntitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `digitalEntitlements_orderId_book_unique` UNIQUE(`orderId`,`digitalBookId`)
);
--> statement-breakpoint
CREATE TABLE `paymentProofs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`transactionReference` varchar(160),
	`note` text,
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` text NOT NULL,
	`status` enum('قيد المراجعة','مقبول','مرفوض') NOT NULL DEFAULT 'قيد المراجعة',
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentProofs_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentProofs_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `paymentSettings` (
	`id` int NOT NULL,
	`vodafoneCashNumber` varchar(32) NOT NULL,
	`vodafoneCashRecipient` varchar(160) NOT NULL,
	`fawryMode` enum('معطّل','إثبات يدوي','تكامل فوري') NOT NULL DEFAULT 'معطّل',
	`fawryMerchantLabel` varchar(160) NOT NULL,
	`fawryServiceCode` varchar(64) NOT NULL,
	`fawryInstructions` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `paymentMethod` enum('فودافون كاش','فوري','إنستا باي','فيزا/ماستركارد','PayPal') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentReference` varchar(64) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `digitalEntitlements` ADD CONSTRAINT `digitalEntitlements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `digitalEntitlements` ADD CONSTRAINT `digitalEntitlements_digitalBookId_digitalBooks_id_fk` FOREIGN KEY (`digitalBookId`) REFERENCES `digitalBooks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `digitalEntitlements` ADD CONSTRAINT `digitalEntitlements_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentProofs` ADD CONSTRAINT `paymentProofs_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentProofs` ADD CONSTRAINT `paymentProofs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
