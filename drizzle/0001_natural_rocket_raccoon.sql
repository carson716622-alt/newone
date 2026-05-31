CREATE TABLE `officers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`badgeNumber` varchar(32) NOT NULL,
	`firstName` varchar(128) NOT NULL,
	`lastName` varchar(128) NOT NULL,
	`rank` enum('officer','detective','corporal','sergeant','lieutenant','captain','commander','deputy_chief','chief') NOT NULL DEFAULT 'officer',
	`unit` varchar(128),
	`phone` varchar(32),
	`email` varchar(320),
	`hireDate` date,
	`status` enum('active','inactive','on_leave') NOT NULL DEFAULT 'active',
	`maxWeeklyHours` int NOT NULL DEFAULT 40,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `officers_id` PRIMARY KEY(`id`),
	CONSTRAINT `officers_badgeNumber_unique` UNIQUE(`badgeNumber`)
);
--> statement-breakpoint
CREATE TABLE `overtime_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`officerId` int NOT NULL,
	`shiftAssignmentId` int,
	`weekStartDate` date NOT NULL,
	`regularHours` decimal(5,2) NOT NULL DEFAULT '0',
	`overtimeHours` decimal(5,2) NOT NULL DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `overtime_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pto_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`officerId` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`type` enum('vacation','sick','personal','bereavement','other') NOT NULL DEFAULT 'vacation',
	`reason` text,
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pto_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shiftId` int NOT NULL,
	`officerId` int NOT NULL,
	`role` varchar(128),
	`isOvertime` boolean NOT NULL DEFAULT false,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_swap_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestingOfficerId` int NOT NULL,
	`targetOfficerId` int,
	`originalShiftId` int NOT NULL,
	`targetShiftId` int,
	`reason` text,
	`status` enum('pending','accepted','denied','cancelled') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_swap_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`date` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`unit` varchar(128),
	`location` varchar(256),
	`minimumOfficers` int NOT NULL DEFAULT 1,
	`notes` text,
	`status` enum('open','filled','shortage','cancelled') NOT NULL DEFAULT 'open',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `officers` ADD CONSTRAINT `officers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_records` ADD CONSTRAINT `overtime_records_officerId_officers_id_fk` FOREIGN KEY (`officerId`) REFERENCES `officers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_records` ADD CONSTRAINT `overtime_records_shiftAssignmentId_shift_assignments_id_fk` FOREIGN KEY (`shiftAssignmentId`) REFERENCES `shift_assignments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pto_requests` ADD CONSTRAINT `pto_requests_officerId_officers_id_fk` FOREIGN KEY (`officerId`) REFERENCES `officers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pto_requests` ADD CONSTRAINT `pto_requests_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shift_assignments` ADD CONSTRAINT `shift_assignments_shiftId_shifts_id_fk` FOREIGN KEY (`shiftId`) REFERENCES `shifts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shift_assignments` ADD CONSTRAINT `shift_assignments_officerId_officers_id_fk` FOREIGN KEY (`officerId`) REFERENCES `officers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shift_swap_requests` ADD CONSTRAINT `shift_swap_requests_requestingOfficerId_officers_id_fk` FOREIGN KEY (`requestingOfficerId`) REFERENCES `officers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shift_swap_requests` ADD CONSTRAINT `shift_swap_requests_targetOfficerId_officers_id_fk` FOREIGN KEY (`targetOfficerId`) REFERENCES `officers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shift_swap_requests` ADD CONSTRAINT `shift_swap_requests_originalShiftId_shifts_id_fk` FOREIGN KEY (`originalShiftId`) REFERENCES `shifts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shift_swap_requests` ADD CONSTRAINT `shift_swap_requests_targetShiftId_shifts_id_fk` FOREIGN KEY (`targetShiftId`) REFERENCES `shifts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shift_swap_requests` ADD CONSTRAINT `shift_swap_requests_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;