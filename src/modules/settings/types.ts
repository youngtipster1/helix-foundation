export type ModuleKey =
  | "quality"
  | "tools"
  | "debrief"
  | "parts-inventory"
  | "training"
  | "management";

export type ModuleStatus = "available" | "coming-soon";

export type RecordStatus = "active" | "archived";

export type ConfigRecord = {
  id: string;
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

export type PermissionLevel = "admin" | "user" | null;

export type ModulePermissions = {
  quality: PermissionLevel;
  tools: PermissionLevel;
  training: PermissionLevel;
  "parts-inventory": PermissionLevel;
  debrief: PermissionLevel;
  management: PermissionLevel;
};

export type UserAccount = {
  id: string;
  personnelId: string;
  personnelName: string;
  email: string;
  username: string;
  password?: string;
  isSuperAdmin: boolean;
  permissions: ModulePermissions;
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
