CREATE TABLE `candidateCertifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`certificationName` varchar(255) NOT NULL,
	`issuingOrganization` varchar(255) NOT NULL,
	`issueDate` date NOT NULL,
	`expirationDate` date,
	`certificateUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidateCertifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`profilePictureUrl` text,
	`resumeUrl` text,
	`bio` text,
	`phone` varchar(20),
	`location` varchar(255),
	`yearsOfExperience` int,
	`certifications` text,
	`skills` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidateProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidateProfiles_candidateId_unique` UNIQUE(`candidateId`)
);
--> statement-breakpoint
CREATE TABLE `jobExperience` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobTitle` varchar(255) NOT NULL,
	`department` varchar(255) NOT NULL,
	`location` varchar(255),
	`startDate` date NOT NULL,
	`endDate` date,
	`isCurrentPosition` boolean NOT NULL DEFAULT false,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobExperience_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `candidateCertifications_candidateId_idx` ON `candidateCertifications` (`candidateId`);--> statement-breakpoint
CREATE INDEX `candidateProfiles_candidateId_idx` ON `candidateProfiles` (`candidateId`);--> statement-breakpoint
CREATE INDEX `jobExperience_candidateId_idx` ON `jobExperience` (`candidateId`);