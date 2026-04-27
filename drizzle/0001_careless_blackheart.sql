CREATE TABLE `bolos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`suspectName` varchar(200),
	`suspectDescription` text,
	`vehicleDescription` text,
	`lastSeenLocation` text,
	`status` enum('active','cleared') NOT NULL DEFAULT 'active',
	`issuedById` int NOT NULL,
	`clearedById` int,
	`clearedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bolos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callId` int NOT NULL,
	`content` text NOT NULL,
	`authorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `call_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callId` int NOT NULL,
	`unitId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`clearedAt` timestamp,
	CONSTRAINT `call_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(30) NOT NULL,
	`nature` varchar(200) NOT NULL,
	`priority` enum('code_1','code_2','code_3','code_4') NOT NULL,
	`status` enum('pending','dispatched','en_route','on_scene','closed') NOT NULL DEFAULT 'pending',
	`location` text NOT NULL,
	`description` text,
	`callerName` varchar(100),
	`callerPhone` varchar(20),
	`disposition` text,
	`department` enum('leo','fire_ems','both') NOT NULL DEFAULT 'leo',
	`createdById` int NOT NULL,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calls_id` PRIMARY KEY(`id`),
	CONSTRAINT `calls_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `civilians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`dateOfBirth` varchar(20) NOT NULL,
	`gender` enum('male','female','other') NOT NULL,
	`race` varchar(50),
	`address` text,
	`phone` varchar(20),
	`licenseNumber` varchar(30),
	`licenseStatus` enum('valid','suspended','revoked','expired') DEFAULT 'valid',
	`flags` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `civilians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`type` enum('call','bolo','warrant','system') NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(30) NOT NULL,
	`type` enum('arrest','citation','patient_care','fire_incident') NOT NULL,
	`title` varchar(200) NOT NULL,
	`narrative` text NOT NULL,
	`civilianId` int,
	`callId` int,
	`charges` text,
	`location` text,
	`officerId` int NOT NULL,
	`status` enum('draft','submitted','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plate` varchar(20) NOT NULL,
	`make` varchar(50) NOT NULL,
	`model` varchar(50) NOT NULL,
	`year` int,
	`color` varchar(30) NOT NULL,
	`vin` varchar(30),
	`registrationStatus` enum('valid','expired','stolen','suspended') DEFAULT 'valid',
	`insuranceStatus` enum('valid','expired','none') DEFAULT 'valid',
	`ownerId` int,
	`flags` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`civilianId` int,
	`suspectName` varchar(200) NOT NULL,
	`charges` text NOT NULL,
	`description` text,
	`status` enum('active','served','recalled') NOT NULL DEFAULT 'active',
	`issuedById` int NOT NULL,
	`servedById` int,
	`servedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warrants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `department` enum('leo','fire_ems','dispatch','admin') DEFAULT 'leo' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `badgeNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `callsign` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `unitStatus` enum('available','busy','en_route','on_scene','off_duty') DEFAULT 'off_duty' NOT NULL;