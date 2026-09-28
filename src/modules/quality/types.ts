export interface PolicyDocument {
  id: string;
  description: string;
  policyNumber: string;
  version: string;
  preparedById: string;
  preparedByName: string;
  reviewedById: string;
  reviewedByName: string;
  approvedById: string;
  approvedByName: string;
  status: string; // Dynamic status from configuration
  lastModified: string;
  isArchived: boolean;
  uploadedBy?: string | undefined;
  createdAt?: string | undefined;
  fileName?: string | undefined;
}

export interface ChecklistItem {
  id: string;
  description: string;
  requirement: string;
  status?: "pass" | "fail" | "na" | null | undefined;
  remarks?: string | undefined;
}

export interface EquipmentChecklist {
  id: string;
  description: string;
  formNumber: string;
  version: string;
  preparedById: string;
  preparedByName: string;
  reviewedById: string;
  reviewedByName: string;
  approvedById: string;
  approvedByName: string;
  status: string; // Dynamic status from configuration
  lastModified: string;
  isArchived: boolean;
  equipmentOem: string;
  modality: string;
  equipmentModel: string;
  type: "upload" | "structured";
  fileName?: string | undefined;
  assignedToId?: string | undefined;
  assignedToName?: string | undefined;
  rejectionNotes?: string | undefined;
  rejectionRecommendations?: string | undefined;
  additionalRecommendedItems?: ChecklistItem[] | undefined;
  executionSummary?: string | undefined;
  items?: ChecklistItem[] | undefined;
}

export interface QualityActivity {
  id: string;
  description: string;
  type: "upload" | "update" | "review" | "approval" | "archive" | "restore";
  timestamp: string;
  user: string;
  targetName: string;
}

/* =========================================================================
   TRAINING & QUALITY COMPLIANCE TYPES
========================================================================= */

export type TrainingStatus = "Pending" | "In Progress" | "Completed";
export type TrainingSourceType = "policy_document" | "uploaded_document" | "typed_instructions";

export interface TrainingAssignment {
  id: string;
  trainingType?: TrainingSourceType | undefined;
  policyDocumentId?: string | undefined;
  policyDocumentTitle: string;
  policyDocumentNumber?: string | undefined;
  documentVersion: string;
  documentFileName?: string | undefined;
  typedInstructions?: string | undefined;
  assignedDate: string;
  completionDate?: string | undefined;
  trainingStatus: TrainingStatus;
  assignedToId: string;
  assignedToName: string;
  assignedById: string;
  assignedByName: string;
  dueDate?: string | undefined;
  acknowledgedAt?: string | undefined;
  acknowledgementNotes?: string | undefined;
  summaryOrScope?: string | undefined;
}

export interface AssignTrainingInput {
  trainingType: TrainingSourceType;
  policyDocumentId?: string | undefined;
  title: string;
  version?: string | undefined;
  fileName?: string | undefined;
  typedInstructions?: string | undefined;
  userIds: string[];
  dueDate?: string | undefined;
  notes?: string | undefined;
}

export interface UserComplianceKPI {
  userId: string;
  userName: string;
  assignedCount: number;
  completedCount: number;
  complianceRate: number; // 0 to 100
  fillColor: string; // #22c55e if 100%, #ef4444 if < 100%
}
