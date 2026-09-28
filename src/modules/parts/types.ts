export interface Supplier {
  id: string;
  name: string;
  supplierCode: string;
  address: string;
  contactPerson: string;
  email: string;
  phone?: string | undefined;
}

export interface PartDocument {
  id: string;
  name: string;
  comment?: string | undefined;
  uploadDate: string;
  url?: string | undefined;
  selected?: boolean | undefined;
}

export type PartLifecycleStatus =
  | "active"
  | "low_stock"
  | "quarantined"
  | "expired"
  | "archived"
  | "obsolete";

export interface Part {
  id: string;
  partNumber: string;
  oemVendorPartNumber: string;
  brand: string;
  category: string;
  oem: string;
  modality: string;
  model: string;
  description: string;
  note?: string | undefined;

  // Stock & Inventory
  quantityInStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  quantityOnOrder: number;
  dateOfPurchase: string;
  shelfLifeMonths?: number | undefined;
  doesNotExpire: boolean;
  expiryDate?: string | null | undefined;
  contactPhone?: string | undefined;

  // Supplier & Order Details
  supplierId: string;
  supplierName: string;
  quantityInPack: number;
  leadTimeWeeks: number;
  listPrice: number;
  vatPercent: number;
  grossPrice: number;
  unitPrice: number; // Unit Cost
  listPriceDate: string;
  orderNote?: string | undefined;

  // Location Details
  location: string;
  binCode: string;
  binNumber: string;
  column: string;
  row: string;
  locationNote?: string | undefined;

  // Visuals & Attachments
  pictureUrl?: string | undefined;
  documents: PartDocument[];

  // Meta
  status: PartLifecycleStatus;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | "opening_balance"
  | "received"
  | "issued"
  | "returned"
  | "adjustment"
  | "audit_variance";

export interface StockMovement {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  modality: string;
  type: StockMovementType;
  quantity: number; // positive (added) or negative (issued/lost)
  balanceAfter: number;
  referenceNumber: string; // e.g. PO-8819, WO-2026-042, AUD-0909
  performedBy: string;
  date: string;
  notes?: string | undefined;
}

export interface AuditItem {
  id: string;
  partId: string;
  partNumber: string;
  oemVendorPartNumber: string;
  supplierName: string;
  category: string;
  age: string;
  oem: string;
  modality: string;
  model: string;
  quantityInStock: number;
  quantityOnOrder: number;
  unitPrice: number;
  location: string;
  column: string;
  row: string;
  auditedQuantity: number | null;
  shrinkageQuantity: number | null;
  shrinkageValue: number | null;
}

export interface AuditRun {
  id: string;
  date: string;
  auditorId: string;
  auditorName: string;
  items: AuditItem[];
  totalAudited: number;
  totalShrinkageQuantity: number;
  totalShrinkageValue: number;
  status: "pending_approval" | "approved" | "rejected";
  approvedBy?: string | undefined;
  approvalDate?: string | undefined;
  notes?: string | undefined;
}

export interface ModalityShare {
  modality: string;
  value: number;
  percentage: number;
}

export interface ExpiryBucket {
  bucket: "< 1 month" | "6 months" | "> 6 months" | "Does not expire";
  count: number;
  color: string;
}

export interface ShrinkageTrendPoint {
  date: string;
  shrinkageValue: number;
  shrinkageQuantity: number;
}

export interface PartsDashboardMetrics {
  totalInventoryValue: number;
  totalInventoryQuantity: number;
  shrinkageValue: number;
  shrinkageQuantity: number;
  lowStockCount: number;
  modalityDistribution: ModalityShare[];
  expiryBuckets: ExpiryBucket[];
  historicalTrends: ShrinkageTrendPoint[];
  recentMovements: StockMovement[];
}
