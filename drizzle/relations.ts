import { relations } from "drizzle-orm";
import {
  officers,
  overtimeRecords,
  ptoRequests,
  shiftAssignments,
  shiftSwapRequests,
  shifts,
  users,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  officers: many(officers),
  createdShifts: many(shifts),
  reviewedPtoRequests: many(ptoRequests),
}));

export const officersRelations = relations(officers, ({ one, many }) => ({
  user: one(users, { fields: [officers.userId], references: [users.id] }),
  shiftAssignments: many(shiftAssignments),
  ptoRequests: many(ptoRequests),
  overtimeRecords: many(overtimeRecords),
  requestedSwaps: many(shiftSwapRequests, {
    relationName: "requestingOfficer",
  }),
  targetedSwaps: many(shiftSwapRequests, { relationName: "targetOfficer" }),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  createdBy: one(users, { fields: [shifts.createdBy], references: [users.id] }),
  assignments: many(shiftAssignments),
  swapRequestsOriginal: many(shiftSwapRequests, {
    relationName: "originalShift",
  }),
  swapRequestsTarget: many(shiftSwapRequests, { relationName: "targetShift" }),
}));

export const shiftAssignmentsRelations = relations(
  shiftAssignments,
  ({ one }) => ({
    shift: one(shifts, {
      fields: [shiftAssignments.shiftId],
      references: [shifts.id],
    }),
    officer: one(officers, {
      fields: [shiftAssignments.officerId],
      references: [officers.id],
    }),
  })
);

export const ptoRequestsRelations = relations(ptoRequests, ({ one }) => ({
  officer: one(officers, {
    fields: [ptoRequests.officerId],
    references: [officers.id],
  }),
  reviewer: one(users, {
    fields: [ptoRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const shiftSwapRequestsRelations = relations(
  shiftSwapRequests,
  ({ one }) => ({
    requestingOfficer: one(officers, {
      fields: [shiftSwapRequests.requestingOfficerId],
      references: [officers.id],
      relationName: "requestingOfficer",
    }),
    targetOfficer: one(officers, {
      fields: [shiftSwapRequests.targetOfficerId],
      references: [officers.id],
      relationName: "targetOfficer",
    }),
    originalShift: one(shifts, {
      fields: [shiftSwapRequests.originalShiftId],
      references: [shifts.id],
      relationName: "originalShift",
    }),
    targetShift: one(shifts, {
      fields: [shiftSwapRequests.targetShiftId],
      references: [shifts.id],
      relationName: "targetShift",
    }),
    reviewer: one(users, {
      fields: [shiftSwapRequests.reviewedBy],
      references: [users.id],
    }),
  })
);

export const overtimeRecordsRelations = relations(
  overtimeRecords,
  ({ one }) => ({
    officer: one(officers, {
      fields: [overtimeRecords.officerId],
      references: [officers.id],
    }),
    shiftAssignment: one(shiftAssignments, {
      fields: [overtimeRecords.shiftAssignmentId],
      references: [shiftAssignments.id],
    }),
  })
);
