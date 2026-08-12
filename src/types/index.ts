/** Shared domain types for the HEMP prototype. */

export type ModuleKey =
  | "quality"
  | "tools"
  | "debrief"
  | "parts-inventory"
  | "training"
  | "management";

export type ModuleStatus = "available" | "coming-soon";

export type RecordStatus = "active" | "archived";

/**
 * A single configuration record (e.g. a Name, a Modality, a Tools OEM).
 * All Quality/Tools settings share this shape so one UI pattern serves them all.
 */
export type ConfigRecord = {
  id: string;
  /** Configuration list this record belongs to, e.g. "quality.modality". */
  configKey: string;
  label: string;
  description?: string;
  status: RecordStatus;
  updatedAt: string;
};

export type ConfigInput = Pick<ConfigRecord, "label" | "description" | "status">;

export type ConfigDefinition = {
  key: string;
  label: string;
  singular: string;
  helper: string;
};

export type Personnel = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  email: string;
  status: RecordStatus;
};

export type AccountRole = "admin" | "user";

export type UserAccount = {
  id: string;
  personnelId: string;
  personnelName: string;
  module: ModuleKey | "all";
  role: AccountRole | "super-admin";
  email: string;
  active: boolean;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  context: string;
  status: "success" | "warning" | "failed";
};
