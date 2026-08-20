export type CalibrationStatus = "valid" | "due_soon" | "expired";

export type WarrantyStatus = "In Warranty" | "Out of Warranty" | "Extended Cover";

export type ToolStatus = "Good" | "Partially working" | "Not working";

export type JobType = "Repair OOW" | "Repair Warranty" | "Calibration";

export type JobStatus = "Not Started" | "In Progress" | "Partially Completed" | "Completed";

export type ExpenseApprovalStatus = "Pending Approval" | "Approved" | "Rejected";

export type RootCause =
  | "Calibration due"
  | "Software"
  | "Power"
  | "Physical damage"
  | "User error";

export interface Tool {
  id: string; // e.g. "TL-00001"
  serialNumber: string;
  category: string;
  oem: string;
  model: string;
  yearOfManufacture: number;
  
  // Calibration
  calibrationStatus: CalibrationStatus;
  lastCalibrationDate: string; // YYYY-MM-DD
  nextCalibrationDate: string; // YYYY-MM-DD (manually entered)
  calibrationValidity: string; // e.g. "12 Months"
  
  // Warranty
  warrantyStatus: WarrantyStatus;
  warrantyStartDate: string;
  warrantyEndDate: string;

  // Vendor
  vendor: string;
  vendorContact: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorAddress: string;

  // Financials
  dateOfPurchase: string;
  poNumber: string;
  cost: number; // in NGN (Naira)
  comment?: string;
  receiptFileName?: string;
  receiptFileSize?: string;
  receiptUrl?: string;

  // Archive & Audit
  isArchived: boolean;
  archivedDate?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolInput {
  id?: string;
  serialNumber: string;
  category: string;
  oem: string;
  model: string;
  yearOfManufacture: number;
  
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  calibrationValidity: string;
  calibrationStatus?: CalibrationStatus;
  
  warrantyStatus: WarrantyStatus;
  warrantyStartDate: string;
  warrantyEndDate: string;

  vendor: string;
  vendorContact: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorAddress: string;

  dateOfPurchase: string;
  poNumber: string;
  cost: number;
  comment?: string;
  receiptFileName?: string;
  receiptFileSize?: string;
}

export interface ToolSnapshot {
  id: string;
  serialNumber: string;
  category: string;
  oem: string;
  model: string;
  calibrationStatus: CalibrationStatus;
  calibrationDate: string;
  calibrationDueDate: string;
  warrantyStatus: WarrantyStatus;
  vendor: string;
}

export interface ToolJob {
  id: string; // Internal key or Job Number e.g. "T00001"
  jobNumber: string; // Sequential "T00001", "T00002"
  toolId: string;
  toolSnapshot: ToolSnapshot;
  
  // Administrative fields (Admin only edit)
  jobType: JobType;
  openDate: string; // System-generated YYYY-MM-DD
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  assignedToId: string;
  assignedToName: string;
  issue: string;

  // Operational fields (Admin & User edit)
  jobStatus: JobStatus;
  startDate?: string;
  toolStatus: ToolStatus;
  rootCause?: RootCause;
  nextCalibrationDate?: string; // Manually entered
  closeDate?: string; // If set, jobStatus becomes "Completed"

  // Archive & Audit
  isArchived: boolean;
  archivedDate?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  toolId: string;
  jobType: JobType;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  assignedToId: string;
  assignedToName: string;
  issue: string;
  toolStatus: ToolStatus;
}

export interface UpdateJobAdminInput {
  jobType?: JobType;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  assignedToId?: string;
  assignedToName?: string;
  issue?: string;
}

export interface UpdateJobOperationalInput {
  jobStatus: JobStatus;
  startDate?: string;
  toolStatus: ToolStatus;
  rootCause?: RootCause;
  nextCalibrationDate?: string;
  closeDate?: string;
}

export interface ToolExpense {
  id: string;
  jobId: string;
  date: string;
  expenseType: string; // e.g. "Replacement Sensor", "Calibration Kit", "Labor", "OEM Service"
  amount: number; // in NGN (Naira)
  comment?: string;
  receiptFileName?: string;
  receiptFileSize?: string;
  approvalStatus: ExpenseApprovalStatus;
  submittedById: string;
  submittedByName: string;
  submittedAt: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface CreateExpenseInput {
  jobId: string;
  date: string;
  expenseType: string;
  amount: number;
  comment?: string;
  receiptFileName?: string;
  receiptFileSize?: string;
}

export type DocumentType =
  | "Calibration Certificate"
  | "Decommissioning Certificate"
  | "Purchase Order"
  | "Service Report"
  | "Warranty Document";

export interface ToolDocument {
  id: string;
  toolId: string;
  jobId?: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  comment?: string;
  uploadedById: string;
  uploadedByName: string;
  dateUploaded: string; // System-generated YYYY-MM-DD
}

export interface UploadDocumentInput {
  toolId: string;
  jobId?: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: string;
  comment?: string;
}
