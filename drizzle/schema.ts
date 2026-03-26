import { mysqlTable, varchar, int, text, timestamp, mysqlEnum, boolean, decimal, unique, index, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ========== CUSTOM AUTHENTICATION TABLES ==========

/**
 * Site Admin Accounts - for ApplytoBlue administrators
 */
export const siteAdmins = mysqlTable("siteAdmins", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("siteAdmins_email_idx").on(table.email),
}));

export type SiteAdmin = typeof siteAdmins.$inferSelect;
export type InsertSiteAdmin = typeof siteAdmins.$inferInsert;

/**
 * Law Enforcement Agencies
 */
export const agencies = mysqlTable("agencies", {
  id: int("id").autoincrement().primaryKey(),
  departmentName: varchar("departmentName", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  website: varchar("website", { length: 255 }).notNull(),
  numberOfOfficers: int("numberOfOfficers").notNull(),
  logo: text("logo"), // URL to logo
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("agencies_email_idx").on(table.email),
}));

export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = typeof agencies.$inferInsert;

/**
 * Agency Admin Accounts - for managing agencies
 */
export const agencyAdmins = mysqlTable("agencyAdmins", {
  id: int("id").autoincrement().primaryKey(),
  agencyId: int("agencyId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "hr"]).default("admin").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agencyIdIdx: index("agencyAdmins_agencyId_idx").on(table.agencyId),
  emailIdx: index("agencyAdmins_email_idx").on(table.email),
}));

export type AgencyAdmin = typeof agencyAdmins.$inferSelect;
export type InsertAgencyAdmin = typeof agencyAdmins.$inferInsert;

/**
 * Job Candidates
 */
export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("candidates_email_idx").on(table.email),
}));

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

/**
 * Job Postings
 */
export const jobPostings = mysqlTable("jobPostings", {
  id: int("id").autoincrement().primaryKey(),
  agencyId: int("agencyId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  salary: varchar("salary", { length: 100 }),
  jobType: varchar("jobType", { length: 50 }).notNull(), // e.g., "Full-time", "Part-time"
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected", "archived"]).default("draft").notNull(),
  requirements: text("requirements"), // JSON or comma-separated
  deadline: timestamp("deadline"),
  isFeatured: boolean("isFeatured").default(false).notNull(), // Featured on homepage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"), // siteAdmin id
}, (table) => ({
  agencyIdIdx: index("jobPostings_agencyId_idx").on(table.agencyId),
  statusIdx: index("jobPostings_status_idx").on(table.status),
}));

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;

/**
 * Job Applications
 */
export const jobApplications = mysqlTable("jobApplications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  candidateId: int("candidateId").notNull(),
  status: mysqlEnum("status", ["applied", "reviewing", "shortlisted", "rejected", "accepted"]).default("applied").notNull(),
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  jobIdIdx: index("jobApplications_jobId_idx").on(table.jobId),
  candidateIdIdx: index("jobApplications_candidateId_idx").on(table.candidateId),
  uniqueApplicationIdx: unique("unique_job_candidate").on(table.jobId, table.candidateId),
}));

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;

/**
 * Notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientType: mysqlEnum("recipientType", ["admin", "agency", "candidate"]).notNull(),
  recipientId: int("recipientId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // e.g., "job_approved", "application_received"
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  recipientIdx: index("notifications_recipient_idx").on(table.recipientType, table.recipientId),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Job Views - track which candidates viewed which jobs
 */
export const jobViews = mysqlTable("jobViews", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  candidateId: int("candidateId"),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("jobViews_jobId_idx").on(table.jobId),
  candidateIdIdx: index("jobViews_candidateId_idx").on(table.candidateId),
}));

export type JobView = typeof jobViews.$inferSelect;
export type InsertJobView = typeof jobViews.$inferInsert;


// ========== CANDIDATE PROFILE TABLES ==========

/**
 * Candidate Profiles - LinkedIn-style profiles for candidates
 */
export const candidateProfiles = mysqlTable("candidateProfiles", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().unique(),
  profilePictureUrl: text("profilePictureUrl"), // URL to profile picture
  resumeUrl: text("resumeUrl"), // URL to resume PDF
  bio: text("bio"), // Short bio/summary
  phone: varchar("phone", { length: 20 }),
  location: varchar("location", { length: 255 }),
  yearsOfExperience: int("yearsOfExperience"),
  certifications: text("certifications"), // JSON array of certifications
  skills: text("skills"), // JSON array of skills
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  candidateIdIdx: index("candidateProfiles_candidateId_idx").on(table.candidateId),
}));

export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type InsertCandidateProfile = typeof candidateProfiles.$inferInsert;

/**
 * Job Experience - work history for candidates
 */
export const jobExperience = mysqlTable("jobExperience", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  isCurrentPosition: boolean("isCurrentPosition").default(false).notNull(),
  description: text("description"), // Job responsibilities and achievements
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  candidateIdIdx: index("jobExperience_candidateId_idx").on(table.candidateId),
}));

export type JobExperience = typeof jobExperience.$inferSelect;
export type InsertJobExperience = typeof jobExperience.$inferInsert;

/**
 * Certifications - law enforcement certifications for candidates
 */
export const candidateCertifications = mysqlTable("candidateCertifications", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  certificationName: varchar("certificationName", { length: 255 }).notNull(),
  issuingOrganization: varchar("issuingOrganization", { length: 255 }).notNull(),
  issueDate: date("issueDate").notNull(),
  expirationDate: date("expirationDate"),
  certificateUrl: text("certificateUrl"), // URL to certificate file
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  candidateIdIdx: index("candidateCertifications_candidateId_idx").on(table.candidateId),
}));

export type CandidateCertification = typeof candidateCertifications.$inferSelect;
export type InsertCandidateCertification = typeof candidateCertifications.$inferInsert;


// ========== MESSAGING SYSTEM ==========
export const conversations = mysqlTable("conversations", {
  id: int("id").primaryKey().autoincrement(),
  candidateId: int("candidateId").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  agencyId: int("agencyId").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  jobPostingId: int("jobPostingId").references(() => jobPostings.id, { onDelete: "set null" }),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  candidateIdIdx: index("conversations_candidateId_idx").on(table.candidateId),
  agencyIdIdx: index("conversations_agencyId_idx").on(table.agencyId),
  jobPostingIdIdx: index("conversations_jobPostingId_idx").on(table.jobPostingId),
  uniqueConversation: index("conversations_unique").on(table.candidateId, table.agencyId, table.jobPostingId),
}));

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: int("senderId").notNull(), // Can be candidateId or agencyAdminId
  senderType: varchar("senderType", { length: 20 }).notNull(), // "candidate" or "agency"
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("messages_conversationId_idx").on(table.conversationId),
  senderIdIdx: index("messages_senderId_idx").on(table.senderId),
  isReadIdx: index("messages_isRead_idx").on(table.isRead),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;


// ========== APPLICATION SYSTEM ==========

/**
 * Application Forms - uploaded by agencies for each job posting
 */
export const applicationForms = mysqlTable("applicationForms", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobPostings.id, { onDelete: "cascade" }),
  formUrl: text("formUrl").notNull(), // S3 URL to the PDF/document
  formFileName: varchar("formFileName", { length: 255 }).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("applicationForms_jobId_idx").on(table.jobId),
}));

export type ApplicationForm = typeof applicationForms.$inferSelect;
export type InsertApplicationForm = typeof applicationForms.$inferInsert;

/**
 * Application Submissions - submitted by candidates
 */
export const applicationSubmissions = mysqlTable("applicationSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobPostings.id, { onDelete: "cascade" }),
  candidateId: int("candidateId").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  submissionUrl: text("submissionUrl").notNull(), // S3 URL to the submitted PDF/document
  submissionFileName: varchar("submissionFileName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["applied", "reviewing", "shortlisted", "rejected", "offered", "accepted"]).default("applied").notNull(),
  notes: text("notes"), // Agency notes on the application
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  jobIdIdx: index("applicationSubmissions_jobId_idx").on(table.jobId),
  candidateIdIdx: index("applicationSubmissions_candidateId_idx").on(table.candidateId),
  statusIdx: index("applicationSubmissions_status_idx").on(table.status),
  uniqueApplicationIdx: unique("unique_job_candidate_submission").on(table.jobId, table.candidateId),
}));

export type ApplicationSubmission = typeof applicationSubmissions.$inferSelect;
export type InsertApplicationSubmission = typeof applicationSubmissions.$inferInsert;
