import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { createSessionToken } from "./_core/customAuth";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import {
  getSiteAdminByEmail, createSiteAdmin,
  getAgencyByEmail, getAgencyById, createAgency,
  getAgencyAdminByEmail, getAgencyAdminById, createAgencyAdmin,
  getCandidateByEmail, getCandidateById, createCandidate,
  getJobPostingById, getJobPostingsByAgencyId, getApprovedJobs, getPendingJobs, getFeaturedJobs, toggleJobFeatured,
  createJobPosting, updateJobPostingStatus, deleteJobPosting,
  createJobApplication, getApplicationsByJobId, getApplicationsByCandidateId,
  createNotification, getNotifications,
  createJobView, getJobViewCount,
  getCandidateProfile, upsertCandidateProfile, updateCandidateProfilePicture, updateCandidateResume,
  getJobExperience, addJobExperience, updateJobExperience, deleteJobExperience,
  getCandidateCertifications, addCertification, updateCertification, deleteCertification,
  getAllCandidateProfiles,
  getOrCreateConversation, getConversationById, getCandidateConversations, getAgencyConversations,
  getConversationMessages, sendMessage, markMessagesAsRead, getUnreadMessageCount, getTotalUnreadMessages,
  uploadApplicationForm, getApplicationFormByJobId, submitApplication, getApplicationSubmissionsByJobId, getApplicationSubmissionsByCandidateId, getApplicationSubmission, updateApplicationStatus
} from "./db";

// Hash password helper
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Compare password helper
async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;

  // Backward compatibility for legacy records that may contain plaintext passwords.
  // New records are always stored as bcrypt hashes.
  const isBcryptHash = hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
  if (!isBcryptHash) {
    return password === hash;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ========== SITE ADMIN AUTHENTICATION ==========
  adminAuth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const admin = await getSiteAdminByEmail(input.email);
          if (!admin) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
          }

          const passwordMatch = await comparePassword(input.password, admin.passwordHash);
          if (!passwordMatch) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
          }

          // Create and set JWT session cookie
          const token = await createSessionToken({
            id: admin.id,
            type: "admin",
            email: admin.email,
            name: admin.name || ""
          });
          
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

          return {
            success: true,
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name
            }
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Login failed" });
        }
      }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2)
      }))
      .mutation(async ({ input }) => {
        try {
          const existing = await getSiteAdminByEmail(input.email);
          if (existing) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Email already registered" });
          }

          const passwordHash = await hashPassword(input.password);
          await createSiteAdmin({
            email: input.email,
            passwordHash,
            name: input.name
          });

          return { success: true, message: "Admin account created" };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registration failed" });
        }
      }),
  }),

  // ========== AGENCY AUTHENTICATION ==========
  agencyAuth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const admin = await getAgencyAdminByEmail(input.email);
          if (!admin) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
          }

          const passwordMatch = await comparePassword(input.password, admin.passwordHash);
          if (!passwordMatch) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
          }

	          // Create and set JWT session cookie
	          const token = await createSessionToken({
	            id: admin.id,
	            type: "agency",
	            email: admin.email,
	            name: admin.name || "",
	            agencyId: admin.agencyId
	          });
          
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

          const agency = await getAgencyById(admin.agencyId);
          return {
            success: true,
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              agencyId: admin.agencyId
            },
            agency: agency ? {
              id: agency.id,
              departmentName: agency.departmentName,
              logo: agency.logo
            } : null
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Login failed" });
        }
      }),

    register: publicProcedure
      .input(z.object({
        departmentName: z.string().min(2),
        address: z.string().min(5),
        phone: z.string().min(10),
        email: z.string().email(),
        website: z.string().url(),
        numberOfOfficers: z.number().positive(),
        adminName: z.string().min(2),
        password: z.string().min(8),
        logo: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        try {
          // Check if agency email already exists
          const existingAgency = await getAgencyByEmail(input.email);
          if (existingAgency) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Agency email already registered" });
          }

          // Check if admin email already exists
          const existingAdmin = await getAgencyAdminByEmail(input.email);
          if (existingAdmin) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Email already registered" });
          }

          // Create agency
          const agencyResult = await createAgency({
            departmentName: input.departmentName,
            address: input.address,
            phone: input.phone,
            email: input.email,
            website: input.website,
            numberOfOfficers: input.numberOfOfficers,
            logo: input.logo,
            isVerified: false
          });

          // In Drizzle with MySQL, the result is an array where the first element is the ResultSetHeader
          const agencyId = (agencyResult as any)[0]?.insertId || (agencyResult as any).insertId;
          
          if (!agencyId) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get agency ID after creation" });
          }

          // Create agency admin
          const passwordHash = await hashPassword(input.password);
          await createAgencyAdmin({
            agencyId,
            email: input.email,
            passwordHash,
            name: input.adminName,
            role: "admin"
          });

          return { success: true, message: "Agency registered successfully", agencyId };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registration failed" });
        }
      }),
  }),

  // ========== CANDIDATE AUTHENTICATION ==========
  candidateAuth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const candidate = await getCandidateByEmail(input.email);
          if (!candidate) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
          }

          const passwordMatch = await comparePassword(input.password, candidate.passwordHash);
          if (!passwordMatch) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
          }

          // Create and set JWT session cookie
          const token = await createSessionToken({
            id: candidate.id,
            type: "candidate",
            email: candidate.email,
            name: candidate.name || ""
          });
          
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

          return {
            success: true,
            candidate: {
              id: candidate.id,
              email: candidate.email,
              name: candidate.name
            }
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Login failed" });
        }
      }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8)
      }))
      .mutation(async ({ input }) => {
        try {
          const existing = await getCandidateByEmail(input.email);
          if (existing) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Email already registered" });
          }

          const passwordHash = await hashPassword(input.password);
          const result = await createCandidate({
            name: input.name,
            email: input.email,
            passwordHash
          });

          return { success: true, message: "Candidate account created" };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registration failed" });
        }
      }),
  }),

  // ========== JOB POSTINGS ==========
  jobs: router({
    getApproved: publicProcedure
      .query(async () => {
        try {
          return await getApprovedJobs();
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch jobs" });
        }
      }),

    getPending: publicProcedure
      .query(async () => {
        try {
          return await getPendingJobs();
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch pending jobs" });
        }
      }),

    getFeatured: publicProcedure
      .query(async () => {
        try {
          return await getFeaturedJobs();
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch featured jobs" });
        }
      }),

    getByAgency: publicProcedure
      .input(z.object({ agencyId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getJobPostingsByAgencyId(input.agencyId);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch jobs" });
        }
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getJobPostingById(input.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch job" });
        }
      }),

    create: publicProcedure
      .input(z.object({
        agencyId: z.number(),
        title: z.string().min(5),
        description: z.string().min(20),
        location: z.string().min(3),
        salary: z.string().optional(),
        jobType: z.string().min(3),
        requirements: z.string().optional(),
        deadline: z.date().optional()
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await createJobPosting({
            agencyId: input.agencyId,
            title: input.title,
            description: input.description,
            location: input.location,
            salary: input.salary,
            jobType: input.jobType,
            requirements: input.requirements,
            deadline: input.deadline,
            status: "pending_approval"
          });

          const jobId = (result as any)[0]?.insertId || (result as any).insertId;
          return { success: true, jobId };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create job" });
        }
      }),

    approve: publicProcedure
      .input(z.object({
        jobId: z.number(),
        adminId: z.number()
      }))
      .mutation(async ({ input }) => {
        try {
          await updateJobPostingStatus(input.jobId, "approved", input.adminId);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to approve job" });
        }
      }),

    reject: publicProcedure
      .input(z.object({
        jobId: z.number()
      }))
      .mutation(async ({ input }) => {
        try {
          await updateJobPostingStatus(input.jobId, "rejected");
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to reject job" });
        }
      }),
        toggleFeatured: publicProcedure
      .input(z.object({
        jobId: z.number(),
        isFeatured: z.boolean()
      }))
      .mutation(async ({ input }) => {
        try {
          await toggleJobFeatured(input.jobId, input.isFeatured);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to toggle featured status" });
        }
      }),
    delete: publicProcedure
      .input(z.object({
        jobId: z.number()
      }))
      .mutation(async ({ input }) => {
        try {
          await deleteJobPosting(input.jobId);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete job posting" });
        }
      }),
  }),

  // ========== JOB APPLICATIONS ==========


  // ========== NOTIFICATIONS ==========
  notifications: router({
    get: publicProcedure
      .input(z.object({
        recipientType: z.enum(["admin", "agency", "candidate"]),
        recipientId: z.number()
      }))
      .query(async ({ input }) => {
        try {
          return await getNotifications(input.recipientType, input.recipientId);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch notifications" });
        }
      }),

    create: publicProcedure
      .input(z.object({
        recipientType: z.enum(["admin", "agency", "candidate"]),
        recipientId: z.number(),
        title: z.string(),
        message: z.string(),
        type: z.string()
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await createNotification({
            recipientType: input.recipientType,
            recipientId: input.recipientId,
            title: input.title,
            message: input.message,
            type: input.type,
            isRead: false
          });

          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create notification" });
        }
      }),
  }),

  // ========== JOB VIEWS ==========
  jobViews: router({
    track: publicProcedure
      .input(z.object({
        jobId: z.number(),
        candidateId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        try {
          await createJobView({
            jobId: input.jobId,
            candidateId: input.candidateId
          });

          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to track view" });
        }
      }),

    getCount: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        try {
          const count = await getJobViewCount(input.jobId);
          return { count };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get view count" });
        }
      }),
  }),

  // ========== CANDIDATE PROFILES ==========
  profiles: router({
    getMyProfile: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const profile = await getCandidateProfile(ctx.user.id);
          return profile || null;
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch profile" });
        }
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        bio: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        skills: z.string().optional(),
        certifications: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await upsertCandidateProfile({
            candidateId: ctx.user.id,
            ...input
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update profile" });
        }
      }),

    updateProfilePicture: protectedProcedure
      .input(z.object({ pictureUrl: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await updateCandidateProfilePicture(ctx.user.id, input.pictureUrl);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update picture" });
        }
      }),

    updateResume: protectedProcedure
      .input(z.object({ resumeUrl: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await updateCandidateResume(ctx.user.id, input.resumeUrl);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update resume" });
        }
      }),

    // Job Experience
    getExperience: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          return await getJobExperience(ctx.user.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch experience" });
        }
      }),

    addExperience: protectedProcedure
      .input(z.object({
        jobTitle: z.string(),
        department: z.string(),
        location: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        isCurrentPosition: z.boolean().default(false),
        description: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { startDate, endDate, ...rest } = input;
          await addJobExperience({
            candidateId: ctx.user.id,
            ...rest,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add experience" });
        }
      }),

    updateExperience: publicProcedure
      .input(z.object({
        experienceId: z.number(),
        jobTitle: z.string().optional(),
        department: z.string().optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrentPosition: z.boolean().optional(),
        description: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { experienceId, ...data } = input;
          await updateJobExperience(experienceId, {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update experience" });
        }
      }),

    deleteExperience: publicProcedure
      .input(z.object({ experienceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await deleteJobExperience(input.experienceId);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete experience" });
        }
      }),

    // Certifications
    getCertifications: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          return await getCandidateCertifications(ctx.user.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch certifications" });
        }
      }),

    addCertification: protectedProcedure
      .input(z.object({
        certificationName: z.string(),
        issuingOrganization: z.string(),
        issueDate: z.string(),
        expirationDate: z.string().optional(),
        certificateUrl: z.string().url().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { issueDate, expirationDate, ...rest } = input;
          await addCertification({
            candidateId: ctx.user.id,
            ...rest,
            issueDate: new Date(issueDate),
            expirationDate: expirationDate ? new Date(expirationDate) : undefined,
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add certification" });
        }
      }),

    updateCertification: protectedProcedure
      .input(z.object({
        certificationId: z.number(),
        certificationName: z.string().optional(),
        issuingOrganization: z.string().optional(),
        issueDate: z.string().optional(),
        expirationDate: z.string().optional(),
        certificateUrl: z.string().url().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { certificationId, ...data } = input;
          await updateCertification(certificationId, {
            ...data,
            issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
            expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update certification" });
        }
      }),

    deleteCertification: protectedProcedure
      .input(z.object({ certificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await deleteCertification(input.certificationId);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete certification" });
        }
      }),

    // Admin view
    getAllCandidates: publicProcedure
      .query(async ({ ctx }) => {
        try {
          return await getAllCandidateProfiles();
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch candidates" });
        }
      }),

    getCandidateProfileById: publicProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        try {
          const profile = await getCandidateProfile(input.candidateId);
          if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
          const experience = await getJobExperience(input.candidateId);
          const certifications = await getCandidateCertifications(input.candidateId);
          return { ...profile, experience, certifications };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch profile" });
        }
      }),
  }),

  // ========== MESSAGING ==========
  messaging: router({
    getOrCreateConversation: protectedProcedure
      .input(z.object({
        agencyId: z.number(),
        jobPostingId: z.number().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const convo = await getOrCreateConversation(ctx.user.id, input.agencyId, input.jobPostingId);
          return convo;
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create conversation" });
        }
      }),

    getCandidateConversations: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          return await getCandidateConversations(ctx.user.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch conversations" });
        }
      }),

    getAgencyConversations: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          return await getAgencyConversations(ctx.user.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch conversations" });
        }
      }),

    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          await markMessagesAsRead(input.conversationId, ctx.user.id);
          return await getConversationMessages(input.conversationId);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch messages" });
        }
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1)
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const convo = await getConversationById(input.conversationId);
          if (!convo) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
          
          const senderType = convo.candidateId === ctx.user.id ? "candidate" : "agency";
          const message = await sendMessage(input.conversationId, ctx.user.id, senderType, input.content);
          return message;
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send message" });
        }
      }),

    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const totalUnread = await getTotalUnreadMessages(ctx.user.id, "candidate");
          return { unreadCount: totalUnread };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get unread count" });
        }
      }),
  }),

  // ========== APPLICATIONS ==========
  applications: router({
    uploadForm: publicProcedure
      .input(z.object({
        jobId: z.number(),
        formUrl: z.string().url(),
        formFileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await uploadApplicationForm({
            jobId: input.jobId,
            formUrl: input.formUrl,
            formFileName: input.formFileName,
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload form" });
        }
      }),

    getForm: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getApplicationFormByJobId(input.jobId);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch form" });
        }
      }),

    submit: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        submissionUrl: z.string().url(),
        submissionFileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await submitApplication({
            jobId: input.jobId,
            candidateId: ctx.user.id,
            submissionUrl: input.submissionUrl,
            submissionFileName: input.submissionFileName,
            status: "applied",
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to submit application" });
        }
      }),

    getByJob: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getApplicationSubmissionsByJobId(input.jobId);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch applications" });
        }
      }),

    getByCandidate: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          return await getApplicationSubmissionsByCandidateId(ctx.user.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch applications" });
        }
      }),

    updateStatus: publicProcedure
      .input(z.object({
        submissionId: z.number(),
        status: z.enum(["applied", "reviewing", "shortlisted", "rejected", "offered", "accepted"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await updateApplicationStatus(input.submissionId, input.status, input.notes);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update status" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
