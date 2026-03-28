import { eq, and, desc, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { 
  InsertUser, users, 
  InsertSiteAdmin, siteAdmins,
  InsertAgency, agencies,
  InsertAgencyAdmin, agencyAdmins,
  InsertCandidate, candidates,
  InsertJobPosting, jobPostings,
  InsertJobApplication, jobApplications,
  InsertNotification, notifications,
  InsertJobView, jobViews,
  InsertCandidateProfile, candidateProfiles,
  InsertJobExperience, jobExperience,
  InsertCandidateCertification, candidateCertifications,
  InsertConversation, conversations,
  InsertMessage, messages,
  InsertApplicationForm, applicationForms,
  InsertApplicationSubmission, applicationSubmissions,
  InsertJobDocumentRequirement, jobDocumentRequirements,
  InsertCandidateDocumentUpload, candidateDocumentUploads
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: 'default' });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== SITE ADMIN QUERIES ==========

export async function getSiteAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(siteAdmins).where(eq(siteAdmins.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSiteAdmin(admin: InsertSiteAdmin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(siteAdmins).values(admin);
  return result;
}

// ========== AGENCY QUERIES ==========

export async function getAgencyByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agencies).where(eq(agencies.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAgencyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agencies).where(eq(agencies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAgency(agency: InsertAgency) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(agencies).values(agency);
  return result;
}

// ========== AGENCY ADMIN QUERIES ==========

export async function getAgencyAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agencyAdmins).where(eq(agencyAdmins.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAgencyAdminById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agencyAdmins).where(eq(agencyAdmins.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAgencyAdmin(admin: InsertAgencyAdmin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(agencyAdmins).values(admin);
  return result;
}

// ========== CANDIDATE QUERIES ==========

export async function getCandidateByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCandidateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCandidate(candidate: InsertCandidate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(candidates).values(candidate);
  return result;
}

// ========== JOB POSTING QUERIES ==========

export async function getJobPostingById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(jobPostings).where(eq(jobPostings.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getJobPostingsByAgencyId(agencyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobPostings).where(eq(jobPostings.agencyId, agencyId));
}

export async function getApprovedJobs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobPostings).where(eq(jobPostings.status, "approved"));
}

export async function getPendingJobs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobPostings).where(eq(jobPostings.status, "pending_approval"));
}

export async function getFeaturedJobs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobPostings).where(
    and(
      eq(jobPostings.status, "approved"),
      eq(jobPostings.isFeatured, true)
    )
  );
}

export async function toggleJobFeatured(jobId: number, isFeatured: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(jobPostings).set({ isFeatured }).where(eq(jobPostings.id, jobId));
}

export async function createJobPosting(job: InsertJobPosting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobPostings).values(job);
  return result;
}

export async function updateJobPostingStatus(jobId: number, status: string, approvedBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status };
  if (approvedBy) {
    updates.approvedBy = approvedBy;
    updates.approvedAt = new Date();
  }
  
  return await db.update(jobPostings).set(updates).where(eq(jobPostings.id, jobId));
}

export async function deleteJobPosting(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Delete all related records first (cascade)
    await db.delete(jobApplications).where(eq(jobApplications.jobId, jobId));
    await db.delete(jobViews).where(eq(jobViews.jobId, jobId));
    
    // Delete the job posting
    return await db.delete(jobPostings).where(eq(jobPostings.id, jobId));
  } catch (error) {
    console.error("Error deleting job posting:", error);
    throw error;
  }
}

// ========== JOB APPLICATION QUERIES ==========

export async function createJobApplication(application: InsertJobApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobApplications).values(application);
  return result;
}

export async function getApplicationsByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
}

export async function getApplicationsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobApplications).where(eq(jobApplications.candidateId, candidateId));
}

// ========== NOTIFICATION QUERIES ==========

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getNotifications(recipientType: 'admin' | 'agency' | 'candidate', recipientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(notifications).where(
    and(
      eq(notifications.recipientType, recipientType),
      eq(notifications.recipientId, recipientId)
    )
  );
}

// ========== JOB VIEW QUERIES ==========

export async function createJobView(view: InsertJobView) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobViews).values(view);
  return result;
}

export async function getJobViewCount(jobId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select().from(jobViews).where(eq(jobViews.jobId, jobId));
  return result.length;
}


// ========== CANDIDATE PROFILE QUERIES ==========

export async function getCandidateProfile(candidateId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(candidateProfiles).where(eq(candidateProfiles.candidateId, candidateId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCandidateProfile(profile: InsertCandidateProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCandidateProfile(profile.candidateId!);
  if (existing) {
    return await db.update(candidateProfiles).set(profile).where(eq(candidateProfiles.candidateId, profile.candidateId!));
  } else {
    return await db.insert(candidateProfiles).values(profile);
  }
}

export async function updateCandidateProfilePicture(candidateId: number, pictureUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(candidateProfiles).set({ profilePictureUrl: pictureUrl }).where(eq(candidateProfiles.candidateId, candidateId));
}

export async function updateCandidateResume(candidateId: number, resumeUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(candidateProfiles).set({ resumeUrl }).where(eq(candidateProfiles.candidateId, candidateId));
}

// ========== JOB EXPERIENCE QUERIES ==========

export async function getJobExperience(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobExperience).where(eq(jobExperience.candidateId, candidateId)).orderBy(desc(jobExperience.startDate));
}

export async function addJobExperience(experience: InsertJobExperience) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobExperience).values(experience);
  return result;
}

export async function updateJobExperience(experienceId: number, experience: Partial<InsertJobExperience>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(jobExperience).set(experience).where(eq(jobExperience.id, experienceId));
}

export async function deleteJobExperience(experienceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(jobExperience).where(eq(jobExperience.id, experienceId));
}

// ========== CERTIFICATION QUERIES ==========

export async function getCandidateCertifications(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(candidateCertifications).where(eq(candidateCertifications.candidateId, candidateId)).orderBy(desc(candidateCertifications.issueDate));
}

export async function addCertification(certification: InsertCandidateCertification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(candidateCertifications).values(certification);
  return result;
}

export async function updateCertification(certificationId: number, certification: Partial<InsertCandidateCertification>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(candidateCertifications).set(certification).where(eq(candidateCertifications.id, certificationId));
}

export async function deleteCertification(certificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(candidateCertifications).where(eq(candidateCertifications.id, certificationId));
}

export async function getAllCandidateProfiles() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(candidateProfiles);
}


// ========== MESSAGING ==========
export async function getOrCreateConversation(candidateId: number, agencyId: number, jobPostingId?: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const whereConditions = [
      eq(conversations.candidateId, candidateId),
      eq(conversations.agencyId, agencyId),
    ];
    if (jobPostingId) whereConditions.push(eq(conversations.jobPostingId, jobPostingId));
    
    const existing = await db.select().from(conversations).where(and(...whereConditions)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    // No existing conversation found, create a new one
    const result = await db.insert(conversations).values({
      candidateId,
      agencyId,
      jobPostingId,
    });

    const newConvo = await db.select().from(conversations).where(eq(conversations.id, result[0].insertId)).limit(1);
    return newConvo[0] || null;
  } catch (error) {
    console.error("Error getting or creating conversation:", error);
    throw error;
  }
}

export async function getConversationById(conversationId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw error;
  }
}

export async function getCandidateConversations(candidateId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const results = await db
      .select({
        id: conversations.id,
        candidateId: conversations.candidateId,
        agencyId: conversations.agencyId,
        jobPostingId: conversations.jobPostingId,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        agencyName: agencies.departmentName,
      })
      .from(conversations)
      .leftJoin(agencies, eq(conversations.agencyId, agencies.id))
      .where(eq(conversations.candidateId, candidateId))
      .orderBy(desc(conversations.lastMessageAt));
    return results;
  } catch (error) {
    console.error("Error getting candidate conversations:", error);
    throw error;
  }
}

export async function getAgencyConversations(agencyId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const results = await db
      .select({
        id: conversations.id,
        candidateId: conversations.candidateId,
        agencyId: conversations.agencyId,
        jobPostingId: conversations.jobPostingId,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        candidateName: candidates.name,
      })
      .from(conversations)
      .leftJoin(candidates, eq(conversations.candidateId, candidates.id))
      .where(eq(conversations.agencyId, agencyId))
      .orderBy(desc(conversations.lastMessageAt));
    return results;
  } catch (error) {
    console.error("Error getting agency conversations:", error);
    throw error;
  }
}

export async function getConversationMessages(conversationId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt));
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    throw error;
  }
}

export async function sendMessage(conversationId: number, senderId: number, senderType: "candidate" | "agency", content: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db.insert(messages).values({
      conversationId,
      senderId,
      senderType,
      content,
    });

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    const newMessage = await db.select().from(messages).where(eq(messages.id, result[0].insertId)).limit(1);
    return newMessage[0] || null;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

export async function markMessagesAsRead(conversationId: number, senderId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, senderId)
      ));
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}

export async function getUnreadMessageCount(conversationId: number, userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db.select().from(messages).where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false),
        ne(messages.senderId, userId)
      ));
    return result.length;
  } catch (error) {
    console.error("Error getting unread message count:", error);
    throw error;
  }
}

export async function getTotalUnreadMessages(userId: number, userType: "candidate" | "agency") {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    let convos: any[] = [];
    if (userType === "candidate") {
      convos = await db.select().from(conversations).where(eq(conversations.candidateId, userId));
    } else {
      convos = await db.select().from(conversations).where(eq(conversations.agencyId, userId));
    }

    let totalUnread = 0;
    for (const convo of convos) {
      const unread = await getUnreadMessageCount(convo.id, userId);
      totalUnread += unread;
    }
    return totalUnread;
  } catch (error) {
    console.error("Error getting total unread messages:", error);
    throw error;
  }
}


// ========== APPLICATION FORMS & SUBMISSIONS ==========

export async function uploadApplicationForm(data: InsertApplicationForm): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(applicationForms).values(data);
  } catch (error) {
    console.error("Error uploading application form:", error);
    throw error;
  }
}

export async function getApplicationFormByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.select().from(applicationForms).where(eq(applicationForms.jobId, jobId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching application form:", error);
    throw error;
  }
}

export async function submitApplication(data: InsertApplicationSubmission): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(applicationSubmissions).values(data);
  } catch (error) {
    console.error("Error submitting application:", error);
    throw error;
  }
}

export async function getApplicationSubmissionsByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const rows = await db
      .select({
        id: applicationSubmissions.id,
        jobId: applicationSubmissions.jobId,
        candidateId: applicationSubmissions.candidateId,
        submissionUrl: applicationSubmissions.submissionUrl,
        submissionFileName: applicationSubmissions.submissionFileName,
        status: applicationSubmissions.status,
        notes: applicationSubmissions.notes,
        submittedAt: applicationSubmissions.submittedAt,
        updatedAt: applicationSubmissions.updatedAt,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
      })
      .from(applicationSubmissions)
      .leftJoin(candidates, eq(applicationSubmissions.candidateId, candidates.id))
      .where(eq(applicationSubmissions.jobId, jobId));
    return rows.map(r => ({
      ...r,
      candidateName: r.candidateName || `Candidate #${r.candidateId}`,
    }));
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
}

export async function getApplicationSubmissionsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const rows = await db
      .select({
        id: applicationSubmissions.id,
        jobId: applicationSubmissions.jobId,
        candidateId: applicationSubmissions.candidateId,
        status: applicationSubmissions.status,
        submittedAt: applicationSubmissions.submittedAt,
        jobTitle: jobPostings.title,
        jobLocation: jobPostings.location,
        agencyName: agencies.departmentName,
        agencyLogo: agencies.logo,
      })
      .from(applicationSubmissions)
      .leftJoin(jobPostings, eq(applicationSubmissions.jobId, jobPostings.id))
      .leftJoin(agencies, eq(jobPostings.agencyId, agencies.id))
      .where(eq(applicationSubmissions.candidateId, candidateId))
      .orderBy(desc(applicationSubmissions.submittedAt));
    return rows;
  } catch (error) {
    console.error("Error fetching candidate applications:", error);
    throw error;
  }
}

export async function getApplicationSubmission(jobId: number, candidateId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.select().from(applicationSubmissions).where(and(
        eq(applicationSubmissions.jobId, jobId),
        eq(applicationSubmissions.candidateId, candidateId)
      )).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching application submission:", error);
    throw error;
  }
}

export async function updateApplicationStatus(submissionId: number, status: string, notes?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.update(applicationSubmissions)
      .set({ 
        status: status as any,
        notes: notes || undefined,
        updatedAt: new Date()
      })
      .where(eq(applicationSubmissions.id, submissionId));
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
}

export async function getAllAgencies() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(agencies);
  } catch (error) {
    console.error("Error fetching all agencies:", error);
    return [];
  }
}


// ========== DOCUMENT REQUIREMENTS ==========

export async function createDocumentRequirements(jobId: number, requirements: { title: string; description?: string; isRequired: boolean; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (requirements.length === 0) return;
  
  const values = requirements.map(r => ({
    jobId,
    title: r.title,
    description: r.description || null,
    isRequired: r.isRequired,
    sortOrder: r.sortOrder,
  }));
  
  await db.insert(jobDocumentRequirements).values(values);
}

export async function getDocumentRequirements(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(jobDocumentRequirements)
      .where(eq(jobDocumentRequirements.jobId, jobId))
      .orderBy(jobDocumentRequirements.sortOrder);
  } catch (error) {
    console.error("Error fetching document requirements:", error);
    return [];
  }
}

export async function deleteDocumentRequirements(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(jobDocumentRequirements).where(eq(jobDocumentRequirements.jobId, jobId));
}

export async function createCandidateDocUpload(upload: InsertCandidateDocumentUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(candidateDocumentUploads).values(upload);
}

export async function getCandidateDocUploads(jobId: number, candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(candidateDocumentUploads)
      .where(and(
        eq(candidateDocumentUploads.jobId, jobId),
        eq(candidateDocumentUploads.candidateId, candidateId)
      ));
  } catch (error) {
    console.error("Error fetching candidate doc uploads:", error);
    return [];
  }
}
