export type EquipmentStatus = "Up" | "Partially Up" | "Down" | "Unknown";

export type WarrantyStatus = "Warranty" | "Out of Warranty";

export type ContractStatus = "In Contract" | "Out of Contract";

export type ContractType =
  | "PM ONLY"
  | "LABOUR ONLY"
  | "PM + LABOUR"
  | "COMPREHENSIVE"
  | "NO CONTRACT";

export type OwnershipType = "Purchased / Owned" | "Leased" | "Donated" | "Rented";

export interface AssetNetworkDiagram {
  id: string;
  fileName: string;
  uploadDate: string;
  comment: string;
  fileUrl?: string;
  size?: string;
}

export interface AssetJob {
  id: string;
  jobNumber: string;
  assetId: string;
  equipmentNumber: string;
  contractId?: string;
  jobType: string;
  jobStatus: "Open" | "In Progress" | "Pending Parts" | "Completed" | "Cancelled";
  startDate: string;
  endDate: string;
  costOfService: number;
  technician: string;
  notes?: string;
  createdAt: string;
}

export interface ContractPayment {
  id: string;
  invoiceNumber: string;
  dateOfPlannedPayment: string;
  dateOfPayment?: string;
  amount: number;
  proofOfPaymentUrl?: string;
  proofOfPaymentName?: string;
  note?: string;
  status: "Paid" | "Pending" | "Overdue";
}

export interface ServiceContract {
  id: string;
  contractNumber: string;
  contractType: ContractType;
  contractValue: number;
  contractStartDate: string;
  contractEndDate: string;
  contractStatus: ContractStatus;
  poNumber: string;
  contractOrderNumber?: string;
  contractInvoiceNumber?: string;
  paymentTermMonths: number;
  paymentStartDate: string;
  paymentEndDate: string;
  nextPaymentDate: string;
  vendorName: string;
  notes?: string;
  documentUrl?: string;
  documentName?: string;
  linkedEquipmentIds: string[];
  payments: ContractPayment[];
  totalAmountPaid: number;
  totalAmountOutstanding: number; // Relabeled as Outstanding Payable
  amountPayableNextMonth: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  // 1. Equipment Identification
  equipmentNumber: string;
  serialNumber: string;
  oem: string;
  modality: string;
  model: string;
  assetType?: string;

  // 2. Status & Lifecycle
  equipmentStatus: EquipmentStatus;
  installationDate: string;
  warrantyStatus: WarrantyStatus;
  warrantyStartDate: string;
  warrantyEndDate: string;

  // Contract read-only reference
  contractId?: string;
  contractStatus: ContractStatus;
  contractNumber?: string;
  contractType?: ContractType;
  contractValue?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  contractOrderNumber?: string;
  contractPoNumber?: string;

  // 3. Service & Software
  ppmSchedule: string;
  nextPpmDate: string;
  swVersion: string;
  dicVersion: string;

  // 4. Supplier & Location
  supplier: string;
  supplierCode?: string;
  supplierContact?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  region: string;
  location: string;
  customer?: string;

  // Data Tab (IT & Network)
  ipAddress?: string;
  macAddress?: string;
  aeTitle?: string;
  portNumber?: string | number;
  subnetMask?: string;
  itNote?: string;
  networkDiagrams: AssetNetworkDiagram[];

  // Financial Tab
  ownershipType: OwnershipType;
  financialNote?: string;

  // Metadata
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDirectoryEntry {
  id: string;
  supplier: string;
  supplierCode: string;
  supplierContact: string;
  email: string;
  phoneNumber: string;
  address: string;
  region: string;
  location: string;
  supportTier?: string;
}

export interface CustomerDirectoryEntry {
  customer: string;
  region: string;
  location: string;
  customerContact: string;
  email: string;
  phoneNumber: string;
}

export interface AssetDashboardMetrics {
  totalEquipment: number;
  totalValue: number;
  totalOems: number;
  warrantyDistribution: { name: string; value: number; color: string; percentage?: number }[];
  equipmentStatusDistribution: { name: string; value: number; color: string; percentage?: number }[];
  assetsByLocation: { location: string; count: number; color?: string }[];
  assetsByModality: { modality: string; count: number; color?: string }[];
  assetsByOem: { oem: string; count: number; color?: string }[];
}

export interface ContractDashboardMetrics {
  totalValue: number;
  totalContracts: number;
  equipmentUnderContract: number;
  totalAmountPaid: number;
  totalAmountOutstanding: number; // Relabeled as Outstanding Payable
  amountPayableNextMonth: number;
  equipmentContractPercentage: { name: string; value: number; color: string }[];
  contractTypeDistribution: { name: string; value: number; color: string }[];
  contractsByLocation: { location: string; count: number }[];
  contractsByModality: { modality: string; count: number }[];
  contractsByOem: { oem: string; count: number }[];
}
