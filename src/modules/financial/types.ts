export type OrderCategory = "PARTS" | "TOOLS" | "LABOUR" | "THIRD_PARTY_SERVICE";

export type OrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "SENT_BACK"
  | "APPROVED"
  | "REQUISITIONED"
  | "FINAL_APPROVED"
  | "PO_CREATED"
  | "PARTIALLY_FULFILLED"
  | "COMPLETED";

export type PurchaseOrderStatus =
  | "ISSUED"
  | "PARTIALLY_FULFILLED"
  | "COMPLETED"
  | "CANCELLED";

export type DocumentType = "Quote" | "Invoice" | "Delivery Note" | "Other";

export interface OrderDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSize?: string | undefined;
  uploadDate: string;
  url?: string | undefined;
}

export interface ApprovalHistoryEntry {
  id: string;
  action:
    | "Created"
    | "Submitted"
    | "Sent Back"
    | "Resubmitted"
    | "Approved"
    | "Requisition Generated"
    | "Final Approved"
    | "PO Generated"
    | "Delivery Recorded"
    | "Archived"
    | "Unarchived";
  performedBy: string;
  performedById: string;
  timestamp: string;
  note?: string | undefined; // Mandatory on Send Back
}

export interface OrderItem {
  id: string;
  category: OrderCategory;
  
  // Physical item / Part linking (if applicable)
  partId?: string | undefined;
  partNumber?: string | undefined;
  description: string;
  specifications?: string | undefined; // Model, OEM, Modality or Service details

  // Supplier
  supplierId: string;
  supplierName: string;
  supplierEmail?: string | undefined;
  supplierPhone?: string | undefined;
  supplierAddress?: string | undefined;

  // Quantity & Pack details
  quantityInPack?: number | undefined; // Where pack-based
  numberOfPacks?: number | undefined;
  totalQuantity: number;

  // Financial calculations
  unitPrice: number; // Price of ONE individual unit
  totalPrice: number; // Total Quantity * Unit Price
  vatPercent: number; // e.g. 7.5 or 20
  vatAmount: number; // Total Price * (vatPercent / 100)
  grossTotal: number; // Total Price + VAT Amount

  // Fulfillment Tracking
  orderedQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;

  // Target delivery / completion date
  targetDeliveryDate?: string | undefined;
}

export interface Requisition {
  id: string;
  requisitionNumber: string; // e.g. "REQ-001"
  orderId: string;
  orderNumber: string;
  generatedAt: string;
  status: "PENDING_FINAL_APPROVAL" | "FINAL_APPROVED";
  approvedAt?: string | undefined;
  approvedBy?: string | undefined;
  notes?: string | undefined;
}

export interface DeliveryItemReceipt {
  orderItemId: string;
  partId?: string | undefined;
  description: string;
  quantityReceived: number;
}

export interface DeliveryRecord {
  id: string;
  poId: string;
  poNumber: string;
  orderId: string;
  orderNumber: string;
  deliveryDate: string;
  deliveryNoteNumber?: string | undefined;
  receivedBy: string;
  receivedById: string;
  itemsReceived: DeliveryItemReceipt[];
  isAccurate: boolean; // Order Accuracy Rate tracking
  accuracyNotes?: string | undefined;
  notes?: string | undefined;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. "PO-2026-001"
  sourceOrderId: string;
  sourceOrderNumber: string;
  requisitionId: string;
  requisitionNumber: string;
  
  // Supplier Specific
  supplierId: string;
  supplierName: string;
  supplierEmail?: string | undefined;
  supplierPhone?: string | undefined;
  supplierAddress?: string | undefined;

  items: OrderItem[];
  totalPrice: number;
  vatAmount: number;
  grossTotal: number;

  targetDeliveryDate: string;
  status: PurchaseOrderStatus;
  createdAt: string;

  deliveries: DeliveryRecord[];
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-001"
  status: OrderStatus;
  category: OrderCategory;
  dateRaised: string; // Automatic, cannot be manually changed

  requestedById: string;
  requestedByName: string;

  targetDeliveryDate: string;
  actualCompletionDate?: string | undefined;

  // Maintenance / Work Order Relationship (compulsory when required)
  jobId?: string | undefined;
  jobNumber?: string | undefined; // e.g. "T00001"
  jobTitle?: string | undefined;

  // Optional Asset Relationship
  assetId?: string | undefined;
  assetName?: string | undefined;

  items: OrderItem[];

  // Financial aggregates
  totalPrice: number;
  vatAmount: number;
  grossTotal: number;

  notes?: string | undefined;
  sendBackReason?: string | undefined;

  documents: OrderDocument[];
  history: ApprovalHistoryEntry[];

  // Requisition and PO linkages
  requisition?: Requisition | undefined;
  purchaseOrderIds?: string[] | undefined;

  // Archive & Audit
  isArchived: boolean;
  archivedAt?: string | undefined;
  archivedBy?: string | undefined;

  // Lifecycle Timestamps for Cycle Time Tracking
  createdAt: string;
  submittedAt?: string | undefined;
  approvedAt?: string | undefined;
  requisitionedAt?: string | undefined;
  finalApprovedAt?: string | undefined;
  poCreatedAt?: string | undefined;
  firstDeliveryAt?: string | undefined;
  completedAt?: string | undefined;
}

export interface CreateOrderItemInput {
  category: OrderCategory;
  partId?: string | undefined;
  partNumber?: string | undefined;
  description: string;
  specifications?: string | undefined;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string | undefined;
  supplierPhone?: string | undefined;
  supplierAddress?: string | undefined;
  quantityInPack?: number | undefined;
  numberOfPacks?: number | undefined;
  totalQuantity: number;
  unitPrice: number;
  vatPercent: number;
  targetDeliveryDate?: string | undefined;
}

export interface CreateOrderInput {
  category: OrderCategory;
  targetDeliveryDate: string;
  requestedById?: string | undefined;
  requestedByName?: string | undefined;
  jobId?: string | undefined;
  jobNumber?: string | undefined;
  jobTitle?: string | undefined;
  assetId?: string | undefined;
  assetName?: string | undefined;
  notes?: string | undefined;
  items: CreateOrderItemInput[];
  documents?: Omit<OrderDocument, "id" | "uploadDate">[] | undefined;
}

export interface RecordDeliveryInput {
  poId: string;
  deliveryDate: string;
  deliveryNoteNumber?: string | undefined;
  itemsReceived: {
    orderItemId: string;
    quantityReceived: number;
  }[];
  isAccurate: boolean;
  accuracyNotes?: string | undefined;
  notes?: string | undefined;
}

export interface FinancialDashboardMetrics {
  totalOrderValue: number;
  otifRate: number; // On-Time, In-Full percentage (0-100)
  orderCycleTimeDays: number; // Average CompletedAt - CreatedAt
  orderAccuracyRate: number; // Accurate orders / Total fulfilled orders percentage (0-100)
  ordersCount: {
    total: number;
    draft: number;
    submitted: number;
    sentBack: number;
    approved: number;
    requisitioned: number;
    poCreated: number;
    completed: number;
    archived: number;
  };
  monthlyTrends: {
    month: string;
    orderValue: number;
    otif: number;
    cycleTimeDays: number;
    accuracyRate: number;
  }[];
}
