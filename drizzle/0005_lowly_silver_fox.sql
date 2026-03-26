CREATE TABLE `agencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departmentName` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320) NOT NULL,
	`website` varchar(255) NOT NULL,
	`numberOfOfficers` int NOT NULL,
	`logo` text,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agencyAdmins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agencyId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('admin','hr') NOT NULL DEFAULT 'admin',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencyAdmins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidates_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `jobApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`candidateId` int NOT NULL,
	`status` enum('applied','reviewing','shortlisted','rejected','accepted') NOT NULL DEFAULT 'applied',
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobApplications_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_job_candidate` UNIQUE(`jobId`,`candidateId`)
);
--> statement-breakpoint
CREATE TABLE `jobPostings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agencyId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255) NOT NULL,
	`salary` varchar(100),
	`jobType` varchar(50) NOT NULL,
	`status` enum('draft','pending_approval','approved','rejected','archived') NOT NULL DEFAULT 'draft',
	`requirements` text,
	`deadline` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`approvedAt` timestamp,
	`approvedBy` int,
	CONSTRAINT `jobPostings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`candidateId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientType` enum('admin','agency','candidate') NOT NULL,
	`recipientId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteAdmins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteAdmins_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteAdmins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `agencies_email_idx` ON `agencies` (`email`);--> statement-breakpoint
CREATE INDEX `agencyAdmins_agencyId_idx` ON `agencyAdmins` (`agencyId`);--> statement-breakpoint
CREATE INDEX `agencyAdmins_email_idx` ON `agencyAdmins` (`email`);--> statement-breakpoint
CREATE INDEX `candidates_email_idx` ON `candidates` (`email`);--> statement-breakpoint
CREATE INDEX `jobApplications_jobId_idx` ON `jobApplications` (`jobId`);--> statement-breakpoint
CREATE INDEX `jobApplications_candidateId_idx` ON `jobApplications` (`candidateId`);--> statement-breakpoint
CREATE INDEX `jobPostings_agencyId_idx` ON `jobPostings` (`agencyId`);--> statement-breakpoint
CREATE INDEX `jobPostings_status_idx` ON `jobPostings` (`status`);--> statement-breakpoint
CREATE INDEX `jobViews_jobId_idx` ON `jobViews` (`jobId`);--> statement-breakpoint
CREATE INDEX `jobViews_candidateId_idx` ON `jobViews` (`candidateId`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipientType`,`recipientId`);--> statement-breakpoint
CREATE INDEX `siteAdmins_email_idx` ON `siteAdmins` (`email`);