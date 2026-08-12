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
  uploadedBy?: string;
  createdAt?: string;
  fileName?: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  requirement: string;
  status?: "pass" | "fail" | "na" | null;
  remarks?: string;
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
  fileName?: string;
  items?: ChecklistItem[];
}

export interface QualityActivity {
  id: string;
  description: string;
  type: "upload" | "update" | "review" | "approval" | "archive" | "restore";
  timestamp: string;
  user: string;
  targetName: string;
}
