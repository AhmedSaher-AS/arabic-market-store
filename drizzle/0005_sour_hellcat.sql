CREATE TABLE `storeSettings` (
	`id` int NOT NULL,
	`storeName` varchar(120) NOT NULL,
	`heroEyebrow` varchar(160) NOT NULL,
	`heroTitle` varchar(200) NOT NULL,
	`heroHighlight` varchar(200) NOT NULL,
	`heroDescription` text NOT NULL,
	`footerDescription` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeSettings_id` PRIMARY KEY(`id`)
);
