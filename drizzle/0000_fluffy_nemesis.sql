CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` text NOT NULL,
	`event` text NOT NULL,
	`actor_email` text NOT NULL,
	`actor_role` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`age` integer NOT NULL,
	`sex` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`complaint` text NOT NULL,
	`symptoms` text DEFAULT '' NOT NULL,
	`history` text DEFAULT '' NOT NULL,
	`allergies` text DEFAULT '' NOT NULL,
	`medications` text DEFAULT '' NOT NULL,
	`heart_rate` integer NOT NULL,
	`systolic` integer NOT NULL,
	`diastolic` integer NOT NULL,
	`spo2` integer NOT NULL,
	`temperature` real NOT NULL,
	`pain` integer NOT NULL,
	`esi` integer NOT NULL,
	`confidence` integer NOT NULL,
	`explanation` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL
);
