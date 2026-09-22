export type EquipmentStatus = "UP" | "Partially UP" | "Down";

export type JobPriority = "High" | "Mid" | "Low";

export type RootCause =
  | "User error"
  | "Power supply"
  | "Software"
  | "Hardware"
  | "Consumable"
  | string;

export type Resolution =
  | "Calibration"
  | "Software reload"
  | "Hardware error"
  | "Accessory"
  | "End user training"
  | "Consumable"
  | string;

export type JobStatus = "Open" | "In Progress" | "Pending Review" | "Completed" | "On Hold";

export interface DebriefJob {
  id: string;
  jobNumber: string; // System-generated e.g. "JOB-2026-0001"
  assetNumber: string; // e.g. "EQ-RAD-001"
  modality: string;
  oem: string;
  model: string;
  serialNumber: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  contractStartDate: string;
  contractEndDate: string;
  contractType?: string;
  yearOfManufacture: string;
  jobType: string;
  jobOpenDate: string;
  jobStartDate: string;
  equipmentStatus: EquipmentStatus;
  jobPriority: JobPriority;
  assignedToId: string;
  assignedToName: string;
  assistedByIds?: string[];
  assistedByNames?: string[];
  assistedBy?: string;
  complaintDate?: string;
  complaintTime?: string;
  contactName?: string;
  contactEmail?: string;
  location?: string;
  address?: string;
  reportedIssue?: string;
  startDate?: string;
  endDate?: string;
  rootCause?: RootCause;
  resolution?: Resolution;
  jobStatus?: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  // Step 1: Equipment Details
  assetNumber: string;
  modality: string;
  oem: string;
  location: string;
  address: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  model: string;
  serialNumber: string;
  yearOfManufacture: string;
  equipmentStatus: EquipmentStatus;
  contractType: string;
  contractEndDate: string;

  // Step 2: Job Details
  jobType: string;
  jobOpenDate: string;
  complaintDate: string;
  complaintTime: string;
  contactName: string;
  contactEmail: string;
  assignedToId: string;
  assignedToName: string;
  assistedByIds?: string[];
  assistedByNames?: string[];
  jobEquipmentStatus?: EquipmentStatus;
  jobPriority: JobPriority;
  jobStartDate: string;
  reportedIssue: string;
}
