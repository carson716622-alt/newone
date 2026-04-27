/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// CAD System Types
export type Department = "leo" | "fire_ems" | "dispatch" | "admin";
export type UnitStatus = "available" | "busy" | "en_route" | "on_scene" | "off_duty";
export type CallPriority = "code_1" | "code_2" | "code_3" | "code_4";
export type CallStatus = "pending" | "dispatched" | "en_route" | "on_scene" | "closed";
export type WarrantStatus = "active" | "served" | "recalled";
export type BoloStatus = "active" | "cleared";
export type ReportType = "arrest" | "citation" | "patient_care" | "fire_incident";
export type ReportStatus = "draft" | "submitted" | "approved";
export type NotificationType = "call" | "bolo" | "warrant" | "system";

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  available: "Available",
  busy: "Busy",
  en_route: "En Route",
  on_scene: "On Scene",
  off_duty: "Off Duty",
};

export const CALL_PRIORITY_LABELS: Record<CallPriority, string> = {
  code_1: "Code 1",
  code_2: "Code 2",
  code_3: "Code 3",
  code_4: "Code 4",
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  pending: "Pending",
  dispatched: "Dispatched",
  en_route: "En Route",
  on_scene: "On Scene",
  closed: "Closed",
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  leo: "Law Enforcement",
  fire_ems: "Fire/EMS",
  dispatch: "Dispatch",
  admin: "Admin",
};

export const DEPARTMENT_COLORS: Record<Department, string> = {
  leo: "blue",
  fire_ems: "red",
  dispatch: "amber",
  admin: "purple",
};
