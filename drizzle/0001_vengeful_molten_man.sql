CREATE TABLE `recharge_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cardId` int NOT NULL,
	`userId` int NOT NULL,
	`rechargeDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recharge_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sim_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`country` varchar(10) NOT NULL,
	`countryName` varchar(100) NOT NULL,
	`carrier` varchar(100) NOT NULL,
	`phoneNumber` varchar(50) NOT NULL,
	`rechargeCycleDays` int NOT NULL,
	`lastRechargeDate` timestamp NOT NULL,
	`remindDays` json NOT NULL,
	`isConfirmed` boolean NOT NULL DEFAULT false,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sim_cards_id` PRIMARY KEY(`id`)
);
