CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`variantId` varchar(255) NOT NULL,
	`productHandle` varchar(255) NOT NULL,
	`productTitle` varchar(255) NOT NULL,
	`variantTitle` varchar(255),
	`imageUrl` text,
	`unitPrice` decimal(12,2) NOT NULL,
	`quantity` int NOT NULL,
	`lineTotal` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`sourceCartId` varchar(512) NOT NULL,
	`customerName` varchar(160) NOT NULL,
	`customerPhone` varchar(32) NOT NULL,
	`shippingAddress` text NOT NULL,
	`country` varchar(96) NOT NULL,
	`city` varchar(96) NOT NULL,
	`paymentMethod` enum('فودافون كاش','إنستا باي','فيزا/ماستركارد','PayPal') NOT NULL,
	`status` enum('معلق','مؤكد','مشحون','مكتمل') NOT NULL DEFAULT 'معلق',
	`paymentStatus` enum('بانتظار الدفع','مدفوع','فشل','مسترد') NOT NULL DEFAULT 'بانتظار الدفع',
	`total` decimal(12,2) NOT NULL,
	`currencyCode` varchar(8) NOT NULL,
	`checkoutUrl` text NOT NULL,
	`ownerNotified` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;