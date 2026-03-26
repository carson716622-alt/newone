CREATE TABLE `applicationForms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`formUrl` text NOT NULL,
	`formFileName` varchar(255) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `applicationForms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applicationSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`candidateId` int NOT NULL,
	`submissionUrl` text NOT NULL,
	`submissionFileName` varchar(255) NOT NULL,
	`status` enum('applied','reviewing','shortlisted','rejected','offered','accepted') NOT NULL DEFAULT 'applied',
	`notes` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applicationSubmissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_job_candidate_submission` UNIQUE(`jobId`,`candidateId`)
);
--> statement-breakpoint
ALTER TABLE `applicationForms` ADD CONSTRAINT `applicationForms_jobId_jobPostings_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobPostings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicationSubmissions` ADD CONSTRAINT `applicationSubmissions_jobId_jobPostings_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobPostings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicationSubmissions` ADD CONSTRAINT `applicationSubmissions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `applicationForms_jobId_idx` ON `applicationForms` (`jobId`);--> statement-breakpoint
CREATE INDEX `applicationSubmissions_jobId_idx` ON `applicationSubmissions` (`jobId`);--> statement-breakpoint
CREATE INDEX `applicationSubmissions_candidateId_idx` ON `applicationSubmissions` (`candidateId`);--> statement-breakpoint
CREATE INDEX `applicationSubmissions_status_idx` ON `applicationSubmissions` (`status`);