import {
  Order,
  PurchaseOrder,
  CreateOrderInput,
  RecordDeliveryInput,
  OrderStatus,
  FinancialDashboardMetrics,
  OrderItem,
  Requisition,
  DeliveryRecord,
  ApprovalHistoryEntry,
} from "../types";
import { partsService } from "@/modules/parts/services/parts-service";
import type { User } from "@/features/auth/types";

const ORDERS_STORAGE_KEY = "hemp.financial.orders.v4";
const POS_STORAGE_KEY = "hemp.financial.pos.v4";

const INITIAL_ORDERS: Order[] = [
  {
    id: "ord_1",
    orderNumber: "ORD-2026-001",
    status: "COMPLETED",
    category: "PARTS",
    dateRaised: "2026-01-15T09:30:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-02-05",
    actualCompletionDate: "2026-02-03T14:20:00Z",
    jobId: "T00001",
    jobNumber: "T00001",
    jobTitle: "CT Scanner Gantry High-Voltage Inverter Replacement",
    assetId: "TL-00001",
    assetName: "Fluke Biomedical ESA620 Electrical Safety Analyzer",
    totalPrice: 29000000,
    vatAmount: 2175000,
    grossTotal: 31175000,
    notes: "Urgent biomedical replacement for Oncology Wing CT Apex.",
    items: [
      {
        id: "item_1_1",
        category: "PARTS",
        partId: "prt_1",
        partNumber: "PRT-CT-1021",
        description: "Dual Energy High-Voltage Inverter Control PCB Assembly for Revolution Apex",
        specifications: "GE Healthcare - Revolution CT - Modality: CT",
        supplierId: "sup_2",
        supplierName: "GE Healthcare Direct",
        supplierEmail: "spares.emea@gehealthcare.com",
        supplierPhone: "+44 800 032 5050",
        supplierAddress: "Pollards Wood, Nightingales Lane, Chalfont St Giles HP8 4SP, UK",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 14500000,
        totalPrice: 29000000,
        vatPercent: 7.5,
        vatAmount: 2175000,
        grossTotal: 31175000,
        orderedQuantity: 2,
        fulfilledQuantity: 2,
        remainingQuantity: 0,
        targetDeliveryDate: "2026-02-05",
      },
    ],
    documents: [
      {
        id: "doc_1_1",
        type: "Quote",
        fileName: "GE_Apex_Inverter_Quote_Ref992.pdf",
        fileSize: "1.4 MB",
        uploadDate: "2026-01-15T09:35:00Z",
      },
      {
        id: "doc_1_2",
        type: "Delivery Note",
        fileName: "DN_GEHC_882910.pdf",
        fileSize: "840 KB",
        uploadDate: "2026-02-03T14:25:00Z",
      },
    ],
    history: [
      {
        id: "hist_1_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-01-15T09:30:00Z",
      },
      {
        id: "hist_1_2",
        action: "Submitted",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-01-15T09:32:00Z",
      },
      {
        id: "hist_1_3",
        action: "Approved",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-01-16T11:00:00Z",
        note: "Approved for emergency oncology imaging restoration.",
      },
      {
        id: "hist_1_4",
        action: "Requisition Generated",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-01-16T11:00:00Z",
      },
      {
        id: "hist_1_5",
        action: "Final Approved",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-01-17T14:00:00Z",
        note: "Purchase order authorized under capital maintenance budget.",
      },
      {
        id: "hist_1_6",
        action: "PO Generated",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-01-17T14:05:00Z",
      },
      {
        id: "hist_1_7",
        action: "Delivery Recorded",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-02-03T14:20:00Z",
        note: "2 units received intact. Parts inventory updated.",
      },
    ],
    requisition: {
      id: "req_1",
      requisitionNumber: "REQ-2026-001",
      orderId: "ord_1",
      orderNumber: "ORD-2026-001",
      generatedAt: "2026-01-16T11:00:00Z",
      status: "FINAL_APPROVED",
      approvedAt: "2026-01-17T14:00:00Z",
      approvedBy: "Dr. Alistair Finch (Admin)",
    },
    purchaseOrderIds: ["po_1"],
    isArchived: false,
    createdAt: "2026-01-15T09:30:00Z",
    submittedAt: "2026-01-15T09:32:00Z",
    approvedAt: "2026-01-16T11:00:00Z",
    requisitionedAt: "2026-01-16T11:00:00Z",
    finalApprovedAt: "2026-01-17T14:00:00Z",
    poCreatedAt: "2026-01-17T14:05:00Z",
    firstDeliveryAt: "2026-02-03T14:20:00Z",
    completedAt: "2026-02-03T14:20:00Z",
  },
  {
    id: "ord_2",
    orderNumber: "ORD-2026-002",
    status: "PO_CREATED",
    category: "PARTS",
    dateRaised: "2026-02-10T10:15:00Z",
    requestedById: "usr_2",
    requestedByName: "Amara Nwosu",
    targetDeliveryDate: "2026-03-01",
    jobId: "T00003",
    jobNumber: "T00003",
    jobTitle: "Cardiology Ultrasound Transducer Replacement & Calibration",
    totalPrice: 18500000,
    vatAmount: 1387500,
    grossTotal: 19887500,
    notes: "Multi-vendor order: Siemens matrix transducer + BioMed sterile biopsy adapters.",
    items: [
      {
        id: "item_2_1",
        category: "PARTS",
        description: "Siemens Healthineers 4Z1c Phased Matrix Ultrasound Probe",
        specifications: "Modality: Ultrasound - Model: ACUSON Sequoia",
        supplierId: "sup_3",
        supplierName: "Siemens Healthineers Logistics",
        supplierEmail: "spares.service@siemens-healthineers.com",
        supplierPhone: "+49 9131 84-0",
        supplierAddress: "Henkestr. 127, 91052 Erlangen, Germany",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 16000000,
        totalPrice: 16000000,
        vatPercent: 7.5,
        vatAmount: 1200000,
        grossTotal: 17200000,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
        targetDeliveryDate: "2026-03-01",
      },
      {
        id: "item_2_2",
        category: "PARTS",
        description: "Sterile Ultrasound Needle Guides (Box of 20 packs)",
        specifications: "Compatible with ACUSON 4Z1c",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        supplierEmail: "orders@biomedglobal.co.uk",
        supplierPhone: "+44 1223 892100",
        supplierAddress: "14 Cavendish Way, Cambridge CB24 9ZR, United Kingdom",
        quantityInPack: 20,
        numberOfPacks: 5,
        totalQuantity: 100,
        unitPrice: 25000,
        totalPrice: 2500000,
        vatPercent: 7.5,
        vatAmount: 187500,
        grossTotal: 2687500,
        orderedQuantity: 100,
        fulfilledQuantity: 0,
        remainingQuantity: 100,
        targetDeliveryDate: "2026-03-01",
      },
    ],
    documents: [
      {
        id: "doc_2_1",
        type: "Quote",
        fileName: "Siemens_Transducer_Proforma_2026.pdf",
        fileSize: "920 KB",
        uploadDate: "2026-02-10T10:18:00Z",
      },
    ],
    history: [
      {
        id: "hist_2_1",
        action: "Created",
        performedBy: "Amara Nwosu",
        performedById: "usr_2",
        timestamp: "2026-02-10T10:15:00Z",
      },
      {
        id: "hist_2_2",
        action: "Submitted",
        performedBy: "Amara Nwosu",
        performedById: "usr_2",
        timestamp: "2026-02-10T10:20:00Z",
      },
      {
        id: "hist_2_3",
        action: "Approved",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-02-11T09:00:00Z",
        note: "Cardiology diagnostic equipment priority approved.",
      },
      {
        id: "hist_2_4",
        action: "Requisition Generated",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-02-11T09:00:00Z",
      },
      {
        id: "hist_2_5",
        action: "Final Approved",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-02-12T11:30:00Z",
      },
      {
        id: "hist_2_6",
        action: "PO Generated",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-02-12T11:35:00Z",
        note: "Generated 2 vendor-specific POs (Siemens & BioMed Global).",
      },
    ],
    requisition: {
      id: "req_2",
      requisitionNumber: "REQ-2026-002",
      orderId: "ord_2",
      orderNumber: "ORD-2026-002",
      generatedAt: "2026-02-11T09:00:00Z",
      status: "FINAL_APPROVED",
      approvedAt: "2026-02-12T11:30:00Z",
      approvedBy: "Dr. Alistair Finch (Admin)",
    },
    purchaseOrderIds: ["po_2_siemens", "po_2_biomed"],
    isArchived: false,
    createdAt: "2026-02-10T10:15:00Z",
    submittedAt: "2026-02-10T10:20:00Z",
    approvedAt: "2026-02-11T09:00:00Z",
    requisitionedAt: "2026-02-11T09:00:00Z",
    finalApprovedAt: "2026-02-12T11:30:00Z",
    poCreatedAt: "2026-02-12T11:35:00Z",
  },
  {
    id: "ord_3",
    orderNumber: "ORD-2026-003",
    status: "SUBMITTED",
    category: "THIRD_PARTY_SERVICE",
    dateRaised: "2026-03-01T14:40:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-03-25",
    jobId: "T00004",
    jobNumber: "T00004",
    jobTitle: "Annual Radiotherapy Linear Accelerator Beam Dosimetry Calibration",
    totalPrice: 8500000,
    vatAmount: 637500,
    grossTotal: 9137500,
    notes: "External third-party radiation physics calibration & IAEA TRS-398 certification audit.",
    items: [
      {
        id: "item_3_1",
        category: "THIRD_PARTY_SERVICE",
        description: "Certified Medical Physics Linear Accelerator Beam Calibration (40 Hours)",
        specifications: "ISO 17025 Accredited Dosimetry & Beam Profiling",
        supplierId: "sup_4",
        supplierName: "Philips Medical Parts Central",
        supplierEmail: "orders.europe@philips.com",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 8500000,
        totalPrice: 8500000,
        vatPercent: 7.5,
        vatAmount: 637500,
        grossTotal: 9137500,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
        targetDeliveryDate: "2026-03-25",
      },
    ],
    documents: [
      {
        id: "doc_3_1",
        type: "Quote",
        fileName: "Dosimetry_Physics_SOW_Proposal.pdf",
        fileSize: "2.1 MB",
        uploadDate: "2026-03-01T14:45:00Z",
      },
    ],
    history: [
      {
        id: "hist_3_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-01T14:40:00Z",
      },
      {
        id: "hist_3_2",
        action: "Submitted",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-01T14:45:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-01T14:40:00Z",
    submittedAt: "2026-03-01T14:45:00Z",
  },
  {
    id: "ord_4",
    orderNumber: "ORD-2026-004",
    status: "SENT_BACK",
    category: "TOOLS",
    dateRaised: "2026-02-24T08:15:00Z",
    requestedById: "usr_2",
    requestedByName: "Amara Nwosu",
    targetDeliveryDate: "2026-03-15",
    jobId: "T00002",
    jobNumber: "T00002",
    jobTitle: "Rigel 288+ Defibrillator Tester Annual Recalibration",
    totalPrice: 4200000,
    vatAmount: 315000,
    grossTotal: 4515000,
    sendBackReason: "Supplier quotation missing valid 60-day price guarantee and calibration ISO 17025 scope of accreditation certificate. Please obtain updated quote from vendor.",
    notes: "High precision calibrated torque tools and safety leads.",
    items: [
      {
        id: "item_4_1",
        category: "TOOLS",
        description: "Insulated Biomedical Calibration Toolset (1000V Certified)",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 2100000,
        totalPrice: 4200000,
        vatPercent: 7.5,
        vatAmount: 315000,
        grossTotal: 4515000,
        orderedQuantity: 2,
        fulfilledQuantity: 0,
        remainingQuantity: 2,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_4_1",
        action: "Created",
        performedBy: "Amara Nwosu",
        performedById: "usr_2",
        timestamp: "2026-02-24T08:15:00Z",
      },
      {
        id: "hist_4_2",
        action: "Submitted",
        performedBy: "Amara Nwosu",
        performedById: "usr_2",
        timestamp: "2026-02-24T08:20:00Z",
      },
      {
        id: "hist_4_3",
        action: "Sent Back",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-02-25T16:00:00Z",
        note: "Supplier quotation missing valid 60-day price guarantee and calibration ISO 17025 scope of accreditation certificate. Please obtain updated quote from vendor.",
      },
    ],
    isArchived: false,
    createdAt: "2026-02-24T08:15:00Z",
    submittedAt: "2026-02-24T08:20:00Z",
  },
  {
    id: "ord_5",
    orderNumber: "ORD-2026-005",
    status: "APPROVED",
    category: "PARTS",
    dateRaised: "2026-03-05T11:00:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-03-30",
    jobId: "T00005",
    jobNumber: "T00005",
    jobTitle: "MRI Helium Compressor Adsorber Replacement",
    totalPrice: 12000000,
    vatAmount: 900000,
    grossTotal: 12900000,
    notes: "Scheduled cryogenics service adsorber capsule.",
    items: [
      {
        id: "item_5_1",
        category: "PARTS",
        description: "Cryo Helium Compressor Adsorber Capsule Filter (F-50)",
        specifications: "Modality: MRI - Model: MAGNETOM Sola",
        supplierId: "sup_3",
        supplierName: "Siemens Healthineers Logistics",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 12000000,
        totalPrice: 12000000,
        vatPercent: 7.5,
        vatAmount: 900000,
        grossTotal: 12900000,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
      },
    ],
    documents: [
      {
        id: "doc_5_1",
        type: "Quote",
        fileName: "Siemens_Cryo_Adsorber_F50_OfficialQuote.pdf",
        fileSize: "1.1 MB",
        uploadDate: "2026-03-05T11:05:00Z",
      },
    ],
    history: [
      {
        id: "hist_5_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-05T11:00:00Z",
      },
      {
        id: "hist_5_2",
        action: "Submitted",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-05T11:10:00Z",
      },
      {
        id: "hist_5_3",
        action: "Approved",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-03-06T15:30:00Z",
        note: "Approved for critical MRI cold-head protection.",
      },
      {
        id: "hist_5_4",
        action: "Requisition Generated",
        performedBy: "Dr. Alistair Finch (Admin)",
        performedById: "adm_1",
        timestamp: "2026-03-06T15:30:00Z",
      },
    ],
    requisition: {
      id: "req_5",
      requisitionNumber: "REQ-2026-005",
      orderId: "ord_5",
      orderNumber: "ORD-2026-005",
      generatedAt: "2026-03-06T15:30:00Z",
      status: "PENDING_FINAL_APPROVAL",
    },
    isArchived: false,
    createdAt: "2026-03-05T11:00:00Z",
    submittedAt: "2026-03-05T11:10:00Z",
    approvedAt: "2026-03-06T15:30:00Z",
    requisitionedAt: "2026-03-06T15:30:00Z",
  },
  {
    id: "ord_6",
    orderNumber: "ORD-2026-006",
    status: "DRAFT",
    category: "PARTS",
    dateRaised: "2026-03-10T16:00:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-04-10",
    notes: "Draft requisition for ventilator replacement flow sensors and bacterial filters.",
    totalPrice: 1500000,
    vatAmount: 112500,
    grossTotal: 1612500,
    items: [
      {
        id: "item_6_1",
        category: "PARTS",
        description: "Paramagnetic Oxygen Sensor Capsule",
        specifications: "Servo-u Ventilator compatible",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 5,
        numberOfPacks: 2,
        totalQuantity: 10,
        unitPrice: 150000,
        totalPrice: 1500000,
        vatPercent: 7.5,
        vatAmount: 112500,
        grossTotal: 1612500,
        orderedQuantity: 10,
        fulfilledQuantity: 0,
        remainingQuantity: 10,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_6_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-10T16:00:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-10T16:00:00Z",
  },
  {
    id: "ord_7",
    orderNumber: "ORD-2026-007",
    status: "SUBMITTED",
    category: "PARTS",
    dateRaised: "2026-03-11T09:15:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-28",
    jobId: "T00003",
    jobNumber: "T00003",
    jobTitle: "Dialysis RO Water Treatment System Semi-Annual Sanitization & Filter Replacement",
    totalPrice: 2850000,
    vatAmount: 213750,
    grossTotal: 3063750,
    notes: "Renal Unit reverse osmosis filtration membrane capsules and carbon pre-filters.",
    items: [
      {
        id: "item_7_1",
        category: "PARTS",
        description: "Medical RO Polyamide Thin-Film Composite Membrane (4x40 inch)",
        specifications: "Dialysis RO Plant - Water Filtration Grade",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 2,
        numberOfPacks: 2,
        totalQuantity: 4,
        unitPrice: 712500,
        totalPrice: 2850000,
        vatPercent: 7.5,
        vatAmount: 213750,
        grossTotal: 3063750,
        orderedQuantity: 4,
        fulfilledQuantity: 0,
        remainingQuantity: 4,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_7_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-11T09:15:00Z",
      },
      {
        id: "hist_7_2",
        action: "Submitted",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-11T09:20:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-11T09:15:00Z",
    submittedAt: "2026-03-11T09:20:00Z",
  },
  {
    id: "ord_8",
    orderNumber: "ORD-2026-008",
    status: "SUBMITTED",
    category: "TOOLS",
    dateRaised: "2026-03-11T11:45:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-04-02",
    jobId: "T00002",
    jobNumber: "T00002",
    jobTitle: "Rigel 288+ Defibrillator Tester Annual Recalibration",
    totalPrice: 3600000,
    vatAmount: 270000,
    grossTotal: 3870000,
    notes: "High bandwidth 200MHz differential oscilloscope probes with 1000V CAT III safety ratings.",
    items: [
      {
        id: "item_8_1",
        category: "TOOLS",
        description: "Differential High-Voltage Active Oscilloscope Probe Kit (200MHz)",
        specifications: "ISO 17025 Certified Probe Set",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 1800000,
        totalPrice: 3600000,
        vatPercent: 7.5,
        vatAmount: 270000,
        grossTotal: 3870000,
        orderedQuantity: 2,
        fulfilledQuantity: 0,
        remainingQuantity: 2,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_8_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-11T11:45:00Z",
      },
      {
        id: "hist_8_2",
        action: "Submitted",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-11T11:50:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-11T11:45:00Z",
    submittedAt: "2026-03-11T11:50:00Z",
  },
  {
    id: "ord_9",
    orderNumber: "ORD-2026-009",
    status: "SUBMITTED",
    category: "PARTS",
    dateRaised: "2026-03-11T14:00:00Z",
    requestedById: "acc_003",
    requestedByName: "Amara Okoye",
    targetDeliveryDate: "2026-03-29",
    jobId: "T00007",
    jobNumber: "T00007",
    jobTitle: "Main Operating Theatre Electrosurgical Generator HF Leakage Testing",
    totalPrice: 1950000,
    vatAmount: 146250,
    grossTotal: 2096250,
    notes: "Operating theatre electrosurgical bipolar titanium forceps and reusable patient return cables.",
    items: [
      {
        id: "item_9_1",
        category: "PARTS",
        description: "Non-Stick Titanium Bipolar Coagulation Forceps (Straight 20cm)",
        specifications: "Autoclavable 134°C - Valleylab compatible",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 5,
        numberOfPacks: 2,
        totalQuantity: 10,
        unitPrice: 195000,
        totalPrice: 1950000,
        vatPercent: 7.5,
        vatAmount: 146250,
        grossTotal: 2096250,
        orderedQuantity: 10,
        fulfilledQuantity: 0,
        remainingQuantity: 10,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_9_1",
        action: "Created",
        performedBy: "Amara Okoye",
        performedById: "acc_003",
        timestamp: "2026-03-11T14:00:00Z",
      },
      {
        id: "hist_9_2",
        action: "Submitted",
        performedBy: "Amara Okoye",
        performedById: "acc_003",
        timestamp: "2026-03-11T14:05:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-11T14:00:00Z",
    submittedAt: "2026-03-11T14:05:00Z",
  },
  {
    id: "ord_10",
    orderNumber: "ORD-2026-010",
    status: "SUBMITTED",
    category: "LABOUR",
    dateRaised: "2026-03-11T15:30:00Z",
    requestedById: "acc_001",
    requestedByName: "John Doe",
    targetDeliveryDate: "2026-04-05",
    jobId: "T00005",
    jobNumber: "T00005",
    jobTitle: "MRI Helium Compressor Adsorber Replacement",
    totalPrice: 6500000,
    vatAmount: 487500,
    grossTotal: 6987500,
    notes: "Specialized OEM cryogenic engineer on-site field support for superconducting magnet vacuum checks.",
    items: [
      {
        id: "item_10_1",
        category: "LABOUR",
        description: "Certified Siemens Cryogenics Senior Field Specialist Support (20 Hours)",
        specifications: "Superconducting 1.5T MRI Magnet System Diagnostics",
        supplierId: "sup_3",
        supplierName: "Siemens Healthineers Logistics",
        quantityInPack: 1,
        numberOfPacks: 20,
        totalQuantity: 20,
        unitPrice: 325000,
        totalPrice: 6500000,
        vatPercent: 7.5,
        vatAmount: 487500,
        grossTotal: 6987500,
        orderedQuantity: 20,
        fulfilledQuantity: 0,
        remainingQuantity: 20,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_10_1",
        action: "Created",
        performedBy: "John Doe",
        performedById: "acc_001",
        timestamp: "2026-03-11T15:30:00Z",
      },
      {
        id: "hist_10_2",
        action: "Submitted",
        performedBy: "John Doe",
        performedById: "acc_001",
        timestamp: "2026-03-11T15:35:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-11T15:30:00Z",
    submittedAt: "2026-03-11T15:35:00Z",
  },
  {
    id: "ord_11",
    orderNumber: "ORD-2026-011",
    status: "PO_CREATED",
    category: "PARTS",
    dateRaised: "2026-03-02T10:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-20",
    jobId: "T00008",
    jobNumber: "T00008",
    jobTitle: "Anaesthesia Machine Flowmeter Block Leakage & Pressure Test",
    totalPrice: 3400000,
    vatAmount: 255000,
    grossTotal: 3655000,
    notes: "Dräger Primus anaesthetic workstation annual preventive maintenance seal and diaphragm kits.",
    items: [
      {
        id: "item_11_1",
        category: "PARTS",
        description: "Dräger Primus Annual Maintenance Overhaul Kit (Seals & Diaphragms)",
        specifications: "Modality: Anaesthesia - Model: Primus Infinity",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 1700000,
        totalPrice: 3400000,
        vatPercent: 7.5,
        vatAmount: 255000,
        grossTotal: 3655000,
        orderedQuantity: 2,
        fulfilledQuantity: 0,
        remainingQuantity: 2,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_11_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-02T10:00:00Z",
      },
      {
        id: "hist_11_2",
        action: "Submitted",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-02T10:05:00Z",
      },
      {
        id: "hist_11_3",
        action: "Approved",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-03T11:00:00Z",
      },
      {
        id: "hist_11_4",
        action: "Requisition Generated",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-03T11:00:00Z",
      },
      {
        id: "hist_11_5",
        action: "Final Approved",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-04T14:30:00Z",
      },
      {
        id: "hist_11_6",
        action: "PO Generated",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-04T14:35:00Z",
      },
    ],
    requisition: {
      id: "req_11",
      requisitionNumber: "REQ-2026-011",
      orderId: "ord_11",
      orderNumber: "ORD-2026-011",
      generatedAt: "2026-03-03T11:00:00Z",
      status: "FINAL_APPROVED",
      approvedAt: "2026-03-04T14:30:00Z",
      approvedBy: "Ngozi Adeleke (Admin)",
    },
    purchaseOrderIds: ["po_11"],
    isArchived: false,
    createdAt: "2026-03-02T10:00:00Z",
    submittedAt: "2026-03-02T10:05:00Z",
    approvedAt: "2026-03-03T11:00:00Z",
    requisitionedAt: "2026-03-03T11:00:00Z",
    finalApprovedAt: "2026-03-04T14:30:00Z",
    poCreatedAt: "2026-03-04T14:35:00Z",
  },
  {
    id: "ord_12",
    orderNumber: "ORD-2026-012",
    status: "PARTIALLY_FULFILLED",
    category: "PARTS",
    dateRaised: "2026-02-18T08:30:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-03-18",
    jobId: "T00009",
    jobNumber: "T00009",
    jobTitle: "ICU Patient Monitor Multi-Parameter Module Repair",
    totalPrice: 4500000,
    vatAmount: 337500,
    grossTotal: 4837500,
    notes: "Multi-parameter patient monitor reusable silicone SpO2 finger probes and 5-lead ECG trunk cables.",
    items: [
      {
        id: "item_12_1",
        category: "PARTS",
        description: "Reusable Adult Silicone Finger Sensor SpO2 Probe (3m)",
        specifications: "Philips IntelliVue Compatible - 8-pin D-sub",
        supplierId: "sup_4",
        supplierName: "Philips Medical Parts Central",
        quantityInPack: 5,
        numberOfPacks: 2,
        totalQuantity: 10,
        unitPrice: 450000,
        totalPrice: 4500000,
        vatPercent: 7.5,
        vatAmount: 337500,
        grossTotal: 4837500,
        orderedQuantity: 10,
        fulfilledQuantity: 6,
        remainingQuantity: 4,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_12_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-02-18T08:30:00Z",
      },
      {
        id: "hist_12_2",
        action: "Submitted",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-02-18T08:35:00Z",
      },
      {
        id: "hist_12_3",
        action: "Approved",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-02-19T09:00:00Z",
      },
      {
        id: "hist_12_4",
        action: "Final Approved",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-02-20T10:00:00Z",
      },
      {
        id: "hist_12_5",
        action: "Delivery Recorded",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-05T14:00:00Z",
        note: "Partial delivery received: 6 out of 10 sensors delivered. 4 back-ordered.",
      },
    ],
    requisition: {
      id: "req_12",
      requisitionNumber: "REQ-2026-012",
      orderId: "ord_12",
      orderNumber: "ORD-2026-012",
      generatedAt: "2026-02-19T09:00:00Z",
      status: "FINAL_APPROVED",
      approvedAt: "2026-02-20T10:00:00Z",
      approvedBy: "Ngozi Adeleke (Admin)",
    },
    purchaseOrderIds: ["po_12"],
    isArchived: false,
    createdAt: "2026-02-18T08:30:00Z",
    submittedAt: "2026-02-18T08:35:00Z",
    approvedAt: "2026-02-19T09:00:00Z",
    requisitionedAt: "2026-02-19T09:00:00Z",
    finalApprovedAt: "2026-02-20T10:00:00Z",
    poCreatedAt: "2026-02-20T10:05:00Z",
    firstDeliveryAt: "2026-03-05T14:00:00Z",
  },
  {
    id: "ord_13",
    orderNumber: "ORD-2026-013",
    status: "APPROVED",
    category: "PARTS",
    dateRaised: "2026-03-07T13:20:00Z",
    requestedById: "acc_002",
    requestedByName: "Liam Fischer",
    targetDeliveryDate: "2026-04-01",
    jobId: "T00010",
    jobNumber: "T00010",
    jobTitle: "Dental Digital OPG Panoramic Sensor Calibration & Testing",
    totalPrice: 7800000,
    vatAmount: 585000,
    grossTotal: 8385000,
    notes: "Replacement high-definition digital sensor plate for dental panoramic radiography unit.",
    items: [
      {
        id: "item_13_1",
        category: "PARTS",
        description: "Dental Digital CCD Panoramic Cephalometric Imaging Sensor",
        specifications: "Carestream CS 8100 3D compatible",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 7800000,
        totalPrice: 7800000,
        vatPercent: 7.5,
        vatAmount: 585000,
        grossTotal: 8385000,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_13_1",
        action: "Created",
        performedBy: "Liam Fischer",
        performedById: "acc_002",
        timestamp: "2026-03-07T13:20:00Z",
      },
      {
        id: "hist_13_2",
        action: "Submitted",
        performedBy: "Liam Fischer",
        performedById: "acc_002",
        timestamp: "2026-03-07T13:25:00Z",
      },
      {
        id: "hist_13_3",
        action: "Approved",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-08T11:00:00Z",
      },
      {
        id: "hist_13_4",
        action: "Requisition Generated",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-08T11:00:00Z",
      },
    ],
    requisition: {
      id: "req_13",
      requisitionNumber: "REQ-2026-013",
      orderId: "ord_13",
      orderNumber: "ORD-2026-013",
      generatedAt: "2026-03-08T11:00:00Z",
      status: "PENDING_FINAL_APPROVAL",
    },
    isArchived: false,
    createdAt: "2026-03-07T13:20:00Z",
    submittedAt: "2026-03-07T13:25:00Z",
    approvedAt: "2026-03-08T11:00:00Z",
    requisitionedAt: "2026-03-08T11:00:00Z",
  },
  {
    id: "ord_14",
    orderNumber: "ORD-2026-014",
    status: "SENT_BACK",
    category: "PARTS",
    dateRaised: "2026-03-01T11:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-24",
    jobId: "T00011",
    jobNumber: "T00011",
    jobTitle: "Pathology Refrigerated High-Speed Centrifuge Rotor Imbalance Check",
    totalPrice: 5200000,
    vatAmount: 390000,
    grossTotal: 5590000,
    sendBackReason: "Missing manufacturer decontamination certificate and rotor maximum RPM rating documentation. Please obtain updated technical sheets from supplier.",
    notes: "High-speed fixed-angle titanium rotor (6 x 250ml) for pathology core lab.",
    items: [
      {
        id: "item_14_1",
        category: "PARTS",
        description: "Fixed-Angle Titanium Ultracentrifuge Rotor (6x250mL)",
        specifications: "Thermo Scientific Sorvall RC-6 Plus - 15,000 RPM Rated",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 5200000,
        totalPrice: 5200000,
        vatPercent: 7.5,
        vatAmount: 390000,
        grossTotal: 5590000,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_14_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-01T11:00:00Z",
      },
      {
        id: "hist_14_2",
        action: "Submitted",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-01T11:05:00Z",
      },
      {
        id: "hist_14_3",
        action: "Sent Back",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-02T16:20:00Z",
        note: "Missing manufacturer decontamination certificate and rotor maximum RPM rating documentation. Please obtain updated technical sheets from supplier.",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-01T11:00:00Z",
    submittedAt: "2026-03-01T11:05:00Z",
  },
  {
    id: "ord_15",
    orderNumber: "ORD-2026-015",
    status: "COMPLETED",
    category: "PARTS",
    dateRaised: "2026-01-20T09:00:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-02-20",
    actualCompletionDate: "2026-02-18T10:00:00Z",
    jobId: "T00012",
    jobNumber: "T00012",
    jobTitle: "Crash Cart Defibrillator Paddle Cable Replacement",
    totalPrice: 2200000,
    vatAmount: 165000,
    grossTotal: 2365000,
    notes: "Emergency department biphasic defibrillator internal surgical paddles and discharge switches.",
    items: [
      {
        id: "item_15_1",
        category: "PARTS",
        description: "Biphasic Defibrillator External Apex/Sternum Paddle Assembly",
        specifications: "ZOLL R Series Compatible with discharge buttons",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 1100000,
        totalPrice: 2200000,
        vatPercent: 7.5,
        vatAmount: 165000,
        grossTotal: 2365000,
        orderedQuantity: 2,
        fulfilledQuantity: 2,
        remainingQuantity: 0,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_15_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-01-20T09:00:00Z",
      },
      {
        id: "hist_15_2",
        action: "Delivery Recorded",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-02-18T10:00:00Z",
        note: "Paddles delivered in full and functionally certified.",
      },
    ],
    isArchived: false,
    createdAt: "2026-01-20T09:00:00Z",
    completedAt: "2026-02-18T10:00:00Z",
  },
  {
    id: "ord_16",
    orderNumber: "ORD-2026-016",
    status: "COMPLETED",
    category: "PARTS",
    dateRaised: "2026-01-28T14:30:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-02-25",
    actualCompletionDate: "2026-02-24T14:30:00Z",
    jobId: "T00013",
    jobNumber: "T00013",
    jobTitle: "Infusion Pump Battery Fleet Capacity Calibration",
    totalPrice: 1800000,
    vatAmount: 135000,
    grossTotal: 1935000,
    notes: "Volumetric infusion pump replacement 12V NiMH rechargeable battery packs.",
    items: [
      {
        id: "item_16_1",
        category: "PARTS",
        description: "Rechargeable 12V 2200mAh Medical Battery Pack for Alaris GP",
        specifications: "BD Alaris Volumetric Pump Battery",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 10,
        numberOfPacks: 2,
        totalQuantity: 20,
        unitPrice: 90000,
        totalPrice: 1800000,
        vatPercent: 7.5,
        vatAmount: 135000,
        grossTotal: 1935000,
        orderedQuantity: 20,
        fulfilledQuantity: 20,
        remainingQuantity: 0,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_16_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-01-28T14:30:00Z",
      },
      {
        id: "hist_16_2",
        action: "Delivery Recorded",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-02-24T14:30:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-01-28T14:30:00Z",
    completedAt: "2026-02-24T14:30:00Z",
  },
  {
    id: "ord_17",
    orderNumber: "ORD-2026-017",
    status: "COMPLETED",
    category: "TOOLS",
    dateRaised: "2026-02-05T10:15:00Z",
    requestedById: "acc_004",
    requestedByName: "Sara Haddad",
    targetDeliveryDate: "2026-03-01",
    actualCompletionDate: "2026-02-28T09:15:00Z",
    jobId: "T00014",
    jobNumber: "T00014",
    jobTitle: "Orthopedic Surgical Power Tool Battery Charger Inspection",
    totalPrice: 2600000,
    vatAmount: 195000,
    grossTotal: 2795000,
    notes: "Stryker 4-bay smart battery charger console for orthopedic trauma saws and drills.",
    items: [
      {
        id: "item_17_1",
        category: "TOOLS",
        description: "Stryker System 7 Universal Multi-Bay Battery Charger Station",
        specifications: "4-bay microprocessor rapid charger",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 2600000,
        totalPrice: 2600000,
        vatPercent: 7.5,
        vatAmount: 195000,
        grossTotal: 2795000,
        orderedQuantity: 1,
        fulfilledQuantity: 1,
        remainingQuantity: 0,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_17_1",
        action: "Created",
        performedBy: "Sara Haddad",
        performedById: "acc_004",
        timestamp: "2026-02-05T10:15:00Z",
      },
      {
        id: "hist_17_2",
        action: "Delivery Recorded",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-02-28T09:15:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-02-05T10:15:00Z",
    completedAt: "2026-02-28T09:15:00Z",
  },
  {
    id: "ord_18",
    orderNumber: "ORD-2026-018",
    status: "COMPLETED",
    category: "PARTS",
    dateRaised: "2026-02-12T16:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-04",
    actualCompletionDate: "2026-03-03T11:00:00Z",
    jobId: "T00015",
    jobNumber: "T00015",
    jobTitle: "Central Sterilization CSSD Autoclave Chamber Door Vacuum Leak",
    totalPrice: 1650000,
    vatAmount: 123750,
    grossTotal: 1773750,
    notes: "Medical grade silicone pneumatic door gasket seals for Getinge autoclave.",
    items: [
      {
        id: "item_18_1",
        category: "PARTS",
        description: "CSSD Steam Sterilizer Pneumatic Door Silicone Gasket (600L Chamber)",
        specifications: "High temperature 140°C steam rated",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 3,
        totalQuantity: 3,
        unitPrice: 550000,
        totalPrice: 1650000,
        vatPercent: 7.5,
        vatAmount: 123750,
        grossTotal: 1773750,
        orderedQuantity: 3,
        fulfilledQuantity: 3,
        remainingQuantity: 0,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_18_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-02-12T16:00:00Z",
      },
      {
        id: "hist_18_2",
        action: "Delivery Recorded",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-03T11:00:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-02-12T16:00:00Z",
    completedAt: "2026-03-03T11:00:00Z",
  },
  {
    id: "ord_19",
    orderNumber: "ORD-2026-019",
    status: "APPROVED",
    category: "PARTS",
    dateRaised: "2025-11-10T11:00:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2025-12-15",
    totalPrice: 8900000,
    vatAmount: 667500,
    grossTotal: 9567500,
    notes: "Historical spare detector circuit board for decommissioned nuclear gamma camera.",
    items: [
      {
        id: "item_19_1",
        category: "PARTS",
        description: "Scintillation Crystal Photomultiplier Preamp Board Assembly",
        specifications: "Dual-Head Gamma Camera Subsystem",
        supplierId: "sup_2",
        supplierName: "GE Healthcare Direct",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 8900000,
        totalPrice: 8900000,
        vatPercent: 7.5,
        vatAmount: 667500,
        grossTotal: 9567500,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_19_1",
        action: "Archived",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2025-12-30T10:00:00Z",
        note: "Archived after asset decommissioning.",
      },
    ],
    isArchived: true,
    archivedAt: "2025-12-30T10:00:00Z",
    archivedBy: "Ngozi Adeleke (Admin)",
    createdAt: "2025-11-10T11:00:00Z",
  },
  {
    id: "ord_20",
    orderNumber: "ORD-2026-020",
    status: "DRAFT",
    category: "PARTS",
    dateRaised: "2025-12-05T14:20:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-01-10",
    totalPrice: 650000,
    vatAmount: 48750,
    grossTotal: 698750,
    notes: "Duplicate draft order cancelled and archived during year-end inventory review.",
    items: [
      {
        id: "item_20_1",
        category: "PARTS",
        description: "Medical Grade Silicone Suction Tubing (Roll of 30m)",
        specifications: "Autoclavable 8mm ID",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 325000,
        totalPrice: 650000,
        vatPercent: 7.5,
        vatAmount: 48750,
        grossTotal: 698750,
        orderedQuantity: 2,
        fulfilledQuantity: 0,
        remainingQuantity: 2,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_20_1",
        action: "Archived",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2025-12-31T15:00:00Z",
      },
    ],
    isArchived: true,
    archivedAt: "2025-12-31T15:00:00Z",
    archivedBy: "Ngozi Adeleke (Admin)",
    createdAt: "2025-12-05T14:20:00Z",
  },
  {
    id: "ord_21",
    orderNumber: "ORD-2026-021",
    status: "COMPLETED",
    category: "PARTS",
    dateRaised: "2025-10-15T09:30:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2025-11-15",
    actualCompletionDate: "2025-11-12T16:00:00Z",
    totalPrice: 3100000,
    vatAmount: 232500,
    grossTotal: 3332500,
    notes: "Legacy 300W Xenon short-arc replacement endoscopy light source bulbs.",
    items: [
      {
        id: "item_21_1",
        category: "PARTS",
        description: "Olympus CLV-190 Compatible 300W Xenon Arc Lamp Module",
        specifications: "Endoscopy Tower High-Intensity Light Source",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 1550000,
        totalPrice: 3100000,
        vatPercent: 7.5,
        vatAmount: 232500,
        grossTotal: 3332500,
        orderedQuantity: 2,
        fulfilledQuantity: 2,
        remainingQuantity: 0,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_21_1",
        action: "Archived",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-01-05T09:00:00Z",
      },
    ],
    isArchived: true,
    archivedAt: "2026-01-05T09:00:00Z",
    archivedBy: "Ngozi Adeleke (Admin)",
    createdAt: "2025-10-15T09:30:00Z",
    completedAt: "2025-11-12T16:00:00Z",
  },
  {
    id: "ord_22",
    orderNumber: "ORD-2026-022",
    status: "SUBMITTED",
    category: "PARTS",
    dateRaised: "2026-03-12T08:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-04-08",
    jobId: "T00016",
    jobNumber: "T00016",
    jobTitle: "Neonatal Intensive Care Infant Incubator Temperature Sensor Calibration",
    totalPrice: 2400000,
    vatAmount: 180000,
    grossTotal: 2580000,
    notes: "NICU closed incubator radiant heater heating coils and skin temperature servo probes.",
    items: [
      {
        id: "item_22_1",
        category: "PARTS",
        description: "Infant Incubator Skin Temperature Servo Thermistor Probe (Box of 5)",
        specifications: "Dräger Isolette C2000 Compatible",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 5,
        numberOfPacks: 2,
        totalQuantity: 10,
        unitPrice: 240000,
        totalPrice: 2400000,
        vatPercent: 7.5,
        vatAmount: 180000,
        grossTotal: 2580000,
        orderedQuantity: 10,
        fulfilledQuantity: 0,
        remainingQuantity: 10,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_22_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-12T08:00:00Z",
      },
      {
        id: "hist_22_2",
        action: "Submitted",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-12T08:05:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-12T08:00:00Z",
    submittedAt: "2026-03-12T08:05:00Z",
  },
  {
    id: "ord_23",
    orderNumber: "ORD-2026-023",
    status: "PO_CREATED",
    category: "PARTS",
    dateRaised: "2026-03-03T11:20:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-26",
    jobId: "T00017",
    jobNumber: "T00017",
    jobTitle: "Mobile Surgical C-Arm X-Ray Collimator Beam Alignment & Safety Survey",
    totalPrice: 1750000,
    vatAmount: 131250,
    grossTotal: 1881250,
    notes: "Theatre mobile fluoroscopy C-arm light field collimator halogen centering bulbs and optical mirrors.",
    items: [
      {
        id: "item_23_1",
        category: "PARTS",
        description: "Halogen Centering Projection Lamp 12V 100W for X-Ray Collimator",
        specifications: "Siemens Cios Alpha Mobile C-Arm Subsystem",
        supplierId: "sup_3",
        supplierName: "Siemens Healthineers Logistics",
        quantityInPack: 2,
        numberOfPacks: 5,
        totalQuantity: 10,
        unitPrice: 175000,
        totalPrice: 1750000,
        vatPercent: 7.5,
        vatAmount: 131250,
        grossTotal: 1881250,
        orderedQuantity: 10,
        fulfilledQuantity: 0,
        remainingQuantity: 10,
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_23_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-03T11:20:00Z",
      },
      {
        id: "hist_23_2",
        action: "Submitted",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-03T11:25:00Z",
      },
      {
        id: "hist_23_3",
        action: "Approved",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-04T10:00:00Z",
      },
      {
        id: "hist_23_4",
        action: "Final Approved",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-05T12:00:00Z",
      },
      {
        id: "hist_23_5",
        action: "PO Generated",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-05T12:05:00Z",
      },
    ],
    requisition: {
      id: "req_23",
      requisitionNumber: "REQ-2026-023",
      orderId: "ord_23",
      orderNumber: "ORD-2026-023",
      generatedAt: "2026-03-04T10:00:00Z",
      status: "FINAL_APPROVED",
      approvedAt: "2026-03-05T12:00:00Z",
      approvedBy: "Ngozi Adeleke (Admin)",
    },
    purchaseOrderIds: ["po_23"],
    isArchived: false,
    createdAt: "2026-03-03T11:20:00Z",
    submittedAt: "2026-03-03T11:25:00Z",
    approvedAt: "2026-03-04T10:00:00Z",
    requisitionedAt: "2026-03-04T10:00:00Z",
    finalApprovedAt: "2026-03-05T12:00:00Z",
    poCreatedAt: "2026-03-05T12:05:00Z",
  },
  {
    id: "ord_24",
    orderNumber: "ORD-2026-024",
    status: "COMPLETED",
    category: "PARTS",
    dateRaised: "2026-02-18T10:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-01",
    actualCompletionDate: "2026-02-28T16:00:00Z",
    jobId: "T00004",
    jobNumber: "T00004",
    jobTitle: "Anesthesia Workstation Vaporizer Seal Overhaul",
    totalPrice: 4200000,
    vatAmount: 315000,
    grossTotal: 4515000,
    notes: "Vaporizer service kit delivered and installed with leak test validation.",
    items: [
      {
        id: "item_24_1",
        category: "PARTS",
        description: "Sevoflurane Vaporizer Service Kit & O-Ring Overhaul Pack",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 2100000,
        totalPrice: 4200000,
        vatPercent: 7.5,
        vatAmount: 315000,
        grossTotal: 4515000,
        orderedQuantity: 2,
        fulfilledQuantity: 2,
        remainingQuantity: 0,
        targetDeliveryDate: "2026-03-01",
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_24_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-02-18T10:00:00Z",
      },
      {
        id: "hist_24_2",
        action: "Final Approved",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-02-20T14:00:00Z",
      },
      {
        id: "hist_24_3",
        action: "Delivery Recorded",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-02-28T16:00:00Z",
        note: "Delivery in full verified against packing slip.",
      },
    ],
    requisition: {
      id: "req_24",
      requisitionNumber: "REQ-2026-024",
      orderId: "ord_24",
      orderNumber: "ORD-2026-024",
      generatedAt: "2026-02-19T11:00:00Z",
      status: "FINAL_APPROVED",
      approvedAt: "2026-02-20T14:00:00Z",
      approvedBy: "Ngozi Adeleke (Admin)",
    },
    purchaseOrderIds: ["po_11"],
    isArchived: false,
    createdAt: "2026-02-18T10:00:00Z",
    submittedAt: "2026-02-18T10:05:00Z",
    approvedAt: "2026-02-19T11:00:00Z",
    requisitionedAt: "2026-02-19T11:00:00Z",
    finalApprovedAt: "2026-02-20T14:00:00Z",
    poCreatedAt: "2026-02-20T14:05:00Z",
    completedAt: "2026-02-28T16:00:00Z",
  },
  {
    id: "ord_25",
    orderNumber: "ORD-2026-025",
    status: "COMPLETED",
    category: "TOOLS",
    dateRaised: "2026-02-14T09:00:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-02-28",
    actualCompletionDate: "2026-02-26T11:30:00Z",
    jobId: "T00005",
    jobNumber: "T00005",
    jobTitle: "Annual Defibrillator Analyzer Re-certification",
    totalPrice: 1200000,
    vatAmount: 90000,
    grossTotal: 1290000,
    notes: "Fluke Biomedical test lead calibration accessories delivered.",
    items: [
      {
        id: "item_25_1",
        category: "TOOLS",
        description: "Defibrillator Paddle Test Adapter Set",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 1200000,
        totalPrice: 1200000,
        vatPercent: 7.5,
        vatAmount: 90000,
        grossTotal: 1290000,
        orderedQuantity: 1,
        fulfilledQuantity: 1,
        remainingQuantity: 0,
        targetDeliveryDate: "2026-02-28",
      },
    ],
    documents: [],
    history: [],
    purchaseOrderIds: ["po_7"],
    isArchived: false,
    createdAt: "2026-02-14T09:00:00Z",
    submittedAt: "2026-02-14T09:05:00Z",
    approvedAt: "2026-02-15T10:00:00Z",
    completedAt: "2026-02-26T11:30:00Z",
  },
  {
    id: "ord_26",
    orderNumber: "ORD-2026-026",
    status: "COMPLETED",
    category: "PARTS",
    dateRaised: "2026-02-10T11:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-02-25",
    actualCompletionDate: "2026-02-24T15:00:00Z",
    jobId: "T00002",
    jobNumber: "T00002",
    jobTitle: "Ventilator Expiratory Flow Sensor Replacement",
    totalPrice: 8000000,
    vatAmount: 600000,
    grossTotal: 8600000,
    notes: "Flow sensors received in full and tested in PICU.",
    items: [
      {
        id: "item_26_1",
        category: "PARTS",
        description: "Hamilton Medical Neonatal Flow Sensors (Box of 10)",
        supplierId: "sup_2",
        supplierName: "GE Healthcare Direct",
        quantityInPack: 10,
        numberOfPacks: 4,
        totalQuantity: 40,
        unitPrice: 200000,
        totalPrice: 8000000,
        vatPercent: 7.5,
        vatAmount: 600000,
        grossTotal: 8600000,
        orderedQuantity: 40,
        fulfilledQuantity: 40,
        remainingQuantity: 0,
        targetDeliveryDate: "2026-02-25",
      },
    ],
    documents: [],
    history: [],
    purchaseOrderIds: ["po_9"],
    isArchived: false,
    createdAt: "2026-02-10T11:00:00Z",
    submittedAt: "2026-02-10T11:05:00Z",
    approvedAt: "2026-02-11T14:00:00Z",
    completedAt: "2026-02-24T15:00:00Z",
  },
  {
    id: "ord_27",
    orderNumber: "ORD-2026-027",
    status: "DRAFT",
    category: "PARTS",
    dateRaised: "2026-01-20T08:00:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-02-15",
    totalPrice: 1500000,
    vatAmount: 112500,
    grossTotal: 1612500,
    notes: "Obsolete model replacement request superseded by manufacturer recall.",
    items: [],
    documents: [],
    history: [],
    isArchived: true,
    archivedAt: "2026-01-25T10:00:00Z",
    archivedBy: "Ngozi Adeleke (Admin)",
    createdAt: "2026-01-20T08:00:00Z",
  },
  {
    id: "ord_28",
    orderNumber: "ORD-2026-028",
    status: "COMPLETED",
    category: "TOOLS",
    dateRaised: "2025-11-15T14:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2025-12-01",
    actualCompletionDate: "2025-11-28T16:00:00Z",
    totalPrice: 3800000,
    vatAmount: 285000,
    grossTotal: 4085000,
    notes: "Prior year ESD safety workstation mats delivered and closed out.",
    items: [],
    documents: [],
    history: [],
    isArchived: true,
    archivedAt: "2026-01-05T09:00:00Z",
    archivedBy: "Ngozi Adeleke (Admin)",
    createdAt: "2025-11-15T14:00:00Z",
    completedAt: "2025-11-28T16:00:00Z",
  },
  {
    id: "ord_29",
    orderNumber: "ORD-2026-029",
    status: "APPROVED",
    category: "THIRD_PARTY_SERVICE",
    dateRaised: "2025-12-05T10:00:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2025-12-20",
    totalPrice: 5200000,
    vatAmount: 390000,
    grossTotal: 5590000,
    notes: "Archived audit service contract renewed under fresh budget code.",
    items: [],
    documents: [],
    history: [],
    isArchived: true,
    archivedAt: "2026-01-08T11:00:00Z",
    archivedBy: "Ngozi Adeleke (Admin)",
    createdAt: "2025-12-05T10:00:00Z",
  },
  {
    id: "ord_30",
    orderNumber: "ORD-2026-030",
    status: "COMPLETED",
    category: "PARTS",
    dateRaised: "2025-10-10T12:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2025-10-30",
    actualCompletionDate: "2025-10-28T14:00:00Z",
    totalPrice: 7500000,
    vatAmount: 562500,
    grossTotal: 8062500,
    notes: "Archived Q4 biomedical batteries batch procurement.",
    items: [],
    documents: [],
    history: [],
    isArchived: true,
    archivedAt: "2026-01-10T15:00:00Z",
    archivedBy: "Ngozi Adeleke (Admin)",
    createdAt: "2025-10-10T12:00:00Z",
    completedAt: "2025-10-28T14:00:00Z",
  },
  {
    id: "ord_31",
    orderNumber: "ORD-2026-031",
    status: "SUBMITTED",
    category: "LABOUR",
    dateRaised: "2025-11-20T09:30:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2025-12-05",
    totalPrice: 2400000,
    vatAmount: 180000,
    grossTotal: 2580000,
    notes: "Prior cycle external specialist calibration hours.",
    items: [],
    documents: [],
    history: [],
    isArchived: true,
    archivedAt: "2026-01-12T10:00:00Z",
    archivedBy: "Ngozi Adeleke (Admin)",
    createdAt: "2025-11-20T09:30:00Z",
  },
  {
    id: "ord_32",
    orderNumber: "ORD-2026-032",
    status: "SUBMITTED",
    category: "PARTS",
    dateRaised: "2026-03-08T09:15:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-24",
    jobId: "T00007",
    jobNumber: "T00007",
    jobTitle: "Dialysis Machine Ultrafiltration Pump Head Replacement",
    totalPrice: 6200000,
    vatAmount: 465000,
    grossTotal: 6665000,
    notes: "Urgent requisition for Renal Ward Fresenius 5008S dialysis unit.",
    items: [
      {
        id: "item_32_1",
        category: "PARTS",
        description: "Fresenius 5008S UF Pump Rotor Head & Tubing Assembly",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 3100000,
        totalPrice: 6200000,
        vatPercent: 7.5,
        vatAmount: 465000,
        grossTotal: 6665000,
        orderedQuantity: 2,
        fulfilledQuantity: 0,
        remainingQuantity: 2,
        targetDeliveryDate: "2026-03-24",
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_32_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-08T09:15:00Z",
      },
      {
        id: "hist_32_2",
        action: "Submitted",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-08T09:18:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-08T09:15:00Z",
    submittedAt: "2026-03-08T09:18:00Z",
  },
  {
    id: "ord_33",
    orderNumber: "ORD-2026-033",
    status: "SUBMITTED",
    category: "TOOLS",
    dateRaised: "2026-03-09T14:30:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-03-26",
    jobId: "T00008",
    jobNumber: "T00008",
    jobTitle: "Biomedical Gas Flow Analyzer Sensor Cell Renewal",
    totalPrice: 4800000,
    vatAmount: 360000,
    grossTotal: 5160000,
    notes: "VT900A gas flow analyzer high-accuracy O2 measurement sensor.",
    items: [
      {
        id: "item_33_1",
        category: "TOOLS",
        description: "Fluke Biomedical VT900A Ultrasonic High-Flow Oxygen Cell",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 4800000,
        totalPrice: 4800000,
        vatPercent: 7.5,
        vatAmount: 360000,
        grossTotal: 5160000,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
        targetDeliveryDate: "2026-03-26",
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_33_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-09T14:30:00Z",
      },
      {
        id: "hist_33_2",
        action: "Submitted",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-09T14:35:00Z",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-09T14:30:00Z",
    submittedAt: "2026-03-09T14:35:00Z",
  },
  {
    id: "ord_34",
    orderNumber: "ORD-2026-034",
    status: "PO_CREATED",
    category: "PARTS",
    dateRaised: "2026-03-01T11:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-20",
    jobId: "T00009",
    jobNumber: "T00009",
    jobTitle: "Radiology C-Arm Fluoroscopy Image Intensifier Power Cable",
    totalPrice: 9400000,
    vatAmount: 705000,
    grossTotal: 10105000,
    notes: "Official PO issued to Siemens logistics.",
    items: [
      {
        id: "item_34_1",
        category: "PARTS",
        description: "Siemens Cios Alpha High-Flex Shielded Gantry Cable Harness",
        supplierId: "sup_3",
        supplierName: "Siemens Healthineers Logistics",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 9400000,
        totalPrice: 9400000,
        vatPercent: 7.5,
        vatAmount: 705000,
        grossTotal: 10105000,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
        targetDeliveryDate: "2026-03-20",
      },
    ],
    documents: [],
    history: [],
    requisition: {
      id: "req_34",
      requisitionNumber: "REQ-2026-034",
      orderId: "ord_34",
      orderNumber: "ORD-2026-034",
      generatedAt: "2026-03-02T10:00:00Z",
      status: "FINAL_APPROVED",
      approvedAt: "2026-03-03T11:00:00Z",
      approvedBy: "Ngozi Adeleke (Admin)",
    },
    purchaseOrderIds: ["po_12"],
    isArchived: false,
    createdAt: "2026-03-01T11:00:00Z",
    submittedAt: "2026-03-01T11:05:00Z",
    approvedAt: "2026-03-02T10:00:00Z",
    requisitionedAt: "2026-03-02T10:00:00Z",
    finalApprovedAt: "2026-03-03T11:00:00Z",
    poCreatedAt: "2026-03-03T11:05:00Z",
  },
  {
    id: "ord_35",
    orderNumber: "ORD-2026-035",
    status: "APPROVED",
    category: "LABOUR",
    dateRaised: "2026-03-02T13:00:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-03-22",
    totalPrice: 3500000,
    vatAmount: 262500,
    grossTotal: 3762500,
    notes: "Specialist LINAC beam calibration specialist hours authorized.",
    items: [
      {
        id: "item_35_1",
        category: "LABOUR",
        description: "Certified Medical Physicist Dosimetry Verification (35 Engineering Hours)",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 35,
        numberOfPacks: 1,
        totalQuantity: 35,
        unitPrice: 100000,
        totalPrice: 3500000,
        vatPercent: 7.5,
        vatAmount: 262500,
        grossTotal: 3762500,
        orderedQuantity: 35,
        fulfilledQuantity: 0,
        remainingQuantity: 35,
        targetDeliveryDate: "2026-03-22",
      },
    ],
    documents: [],
    history: [],
    requisition: {
      id: "req_35",
      requisitionNumber: "REQ-2026-035",
      orderId: "ord_35",
      orderNumber: "ORD-2026-035",
      generatedAt: "2026-03-03T14:00:00Z",
      status: "PENDING_FINAL_APPROVAL",
    },
    isArchived: false,
    createdAt: "2026-03-02T13:00:00Z",
    submittedAt: "2026-03-02T13:05:00Z",
    approvedAt: "2026-03-03T14:00:00Z",
    requisitionedAt: "2026-03-03T14:00:00Z",
  },
  {
    id: "ord_36",
    orderNumber: "ORD-2026-036",
    status: "SENT_BACK",
    category: "PARTS",
    dateRaised: "2026-03-04T15:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-25",
    totalPrice: 5800000,
    vatAmount: 435000,
    grossTotal: 6235000,
    notes: "Patient monitor ECG trunk cable replacement request.",
    sendBackReason: "Please attach the quote from authorized local distributor and verify OEM part number.",
    items: [
      {
        id: "item_36_1",
        category: "PARTS",
        description: "Mindray BeneView 12-Lead ECG Trunk Cable and Leadwire Set",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 10,
        totalQuantity: 10,
        unitPrice: 580000,
        totalPrice: 5800000,
        vatPercent: 7.5,
        vatAmount: 435000,
        grossTotal: 6235000,
        orderedQuantity: 10,
        fulfilledQuantity: 0,
        remainingQuantity: 10,
        targetDeliveryDate: "2026-03-25",
      },
    ],
    documents: [],
    history: [
      {
        id: "hist_36_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-04T15:00:00Z",
      },
      {
        id: "hist_36_2",
        action: "Sent Back",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-05T09:00:00Z",
        note: "Please attach the quote from authorized local distributor and verify OEM part number.",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-04T15:00:00Z",
    submittedAt: "2026-03-04T15:05:00Z",
  },
  {
    id: "ord_37",
    orderNumber: "ORD-2026-037",
    status: "SENT_BACK",
    category: "TOOLS",
    dateRaised: "2026-03-05T10:00:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-28",
    totalPrice: 3200000,
    vatAmount: 240000,
    grossTotal: 3440000,
    notes: "Infusion pump tester pressure sensor transducer probe.",
    sendBackReason: "Job number was missing from this tool purchase request. Please link maintenance job.",
    items: [],
    documents: [],
    history: [
      {
        id: "hist_37_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-05T10:00:00Z",
      },
      {
        id: "hist_37_2",
        action: "Sent Back",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-06T11:00:00Z",
        note: "Job number was missing from this tool purchase request. Please link maintenance job.",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-05T10:00:00Z",
    submittedAt: "2026-03-05T10:05:00Z",
  },
  {
    id: "ord_38",
    orderNumber: "ORD-2026-038",
    status: "SENT_BACK",
    category: "THIRD_PARTY_SERVICE",
    dateRaised: "2026-03-06T11:30:00Z",
    requestedById: "usr_1",
    requestedByName: "Engr. Marcus Adebayo",
    targetDeliveryDate: "2026-03-30",
    totalPrice: 4500000,
    vatAmount: 337500,
    grossTotal: 4837500,
    notes: "Sterilizer autoclave chamber ultrasound non-destructive weld audit.",
    sendBackReason: "Need 2 competitive quotes for services exceeding ₦3M per procurement guidelines.",
    items: [],
    documents: [],
    history: [
      {
        id: "hist_38_1",
        action: "Created",
        performedBy: "Engr. Marcus Adebayo",
        performedById: "usr_1",
        timestamp: "2026-03-06T11:30:00Z",
      },
      {
        id: "hist_38_2",
        action: "Sent Back",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-07T12:00:00Z",
        note: "Need 2 competitive quotes for services exceeding ₦3M per procurement guidelines.",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-06T11:30:00Z",
    submittedAt: "2026-03-06T11:35:00Z",
  },
  {
    id: "ord_39",
    orderNumber: "ORD-2026-039",
    status: "SENT_BACK",
    category: "PARTS",
    dateRaised: "2026-03-07T08:45:00Z",
    requestedById: "acc_009",
    requestedByName: "Tunde Bakare",
    targetDeliveryDate: "2026-03-29",
    totalPrice: 2800000,
    vatAmount: 210000,
    grossTotal: 3010000,
    notes: "Surgical diathermy smoke evacuator filters.",
    sendBackReason: "Quantity requested exceeds 6-month buffer stock. Please reduce to 10 units.",
    items: [],
    documents: [],
    history: [
      {
        id: "hist_39_1",
        action: "Created",
        performedBy: "Tunde Bakare",
        performedById: "acc_009",
        timestamp: "2026-03-07T08:45:00Z",
      },
      {
        id: "hist_39_2",
        action: "Sent Back",
        performedBy: "Ngozi Adeleke (Admin)",
        performedById: "acc_008",
        timestamp: "2026-03-08T10:00:00Z",
        note: "Quantity requested exceeds 6-month buffer stock. Please reduce to 10 units.",
      },
    ],
    isArchived: false,
    createdAt: "2026-03-07T08:45:00Z",
    submittedAt: "2026-03-07T08:50:00Z",
  },
];

const INITIAL_POS: PurchaseOrder[] = [
  {
    id: "po_1",
    poNumber: "PO-2026-001",
    sourceOrderId: "ord_1",
    sourceOrderNumber: "ORD-2026-001",
    requisitionId: "req_1",
    requisitionNumber: "REQ-2026-001",
    supplierId: "sup_2",
    supplierName: "GE Healthcare Direct",
    supplierEmail: "spares.emea@gehealthcare.com",
    supplierPhone: "+44 800 032 5050",
    supplierAddress: "Pollards Wood, Nightingales Lane, Chalfont St Giles HP8 4SP, UK",
    items: [
      {
        id: "item_1_1",
        category: "PARTS",
        partId: "prt_1",
        partNumber: "PRT-CT-1021",
        description: "Dual Energy High-Voltage Inverter Control PCB Assembly for Revolution Apex",
        specifications: "GE Healthcare - Revolution CT - Modality: CT",
        supplierId: "sup_2",
        supplierName: "GE Healthcare Direct",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 14500000,
        totalPrice: 29000000,
        vatPercent: 7.5,
        vatAmount: 2175000,
        grossTotal: 31175000,
        orderedQuantity: 2,
        fulfilledQuantity: 2,
        remainingQuantity: 0,
      },
    ],
    totalPrice: 29000000,
    vatAmount: 2175000,
    grossTotal: 31175000,
    targetDeliveryDate: "2026-02-05",
    status: "COMPLETED",
    createdAt: "2026-01-17T14:05:00Z",
    deliveries: [
      {
        id: "del_1_1",
        poId: "po_1",
        poNumber: "PO-2026-001",
        orderId: "ord_1",
        orderNumber: "ORD-2026-001",
        deliveryDate: "2026-02-03T14:20:00Z",
        deliveryNoteNumber: "DN-GE-882910",
        receivedBy: "Dr. Alistair Finch (Admin)",
        receivedById: "adm_1",
        itemsReceived: [
          {
            orderItemId: "item_1_1",
            partId: "prt_1",
            description: "Dual Energy High-Voltage Inverter Control PCB Assembly",
            quantityReceived: 2,
          },
        ],
        isAccurate: true,
        notes: "Both boards inspected, calibrated, zero shipping damage.",
      },
    ],
  },
  {
    id: "po_2_siemens",
    poNumber: "PO-2026-002A",
    sourceOrderId: "ord_2",
    sourceOrderNumber: "ORD-2026-002",
    requisitionId: "req_2",
    requisitionNumber: "REQ-2026-002",
    supplierId: "sup_3",
    supplierName: "Siemens Healthineers Logistics",
    supplierEmail: "spares.service@siemens-healthineers.com",
    supplierPhone: "+49 9131 84-0",
    supplierAddress: "Henkestr. 127, 91052 Erlangen, Germany",
    items: [
      {
        id: "item_2_1",
        category: "PARTS",
        description: "Siemens Healthineers 4Z1c Phased Matrix Ultrasound Probe",
        specifications: "Modality: Ultrasound - Model: ACUSON Sequoia",
        supplierId: "sup_3",
        supplierName: "Siemens Healthineers Logistics",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 16000000,
        totalPrice: 16000000,
        vatPercent: 7.5,
        vatAmount: 1200000,
        grossTotal: 17200000,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
      },
    ],
    totalPrice: 16000000,
    vatAmount: 1200000,
    grossTotal: 17200000,
    targetDeliveryDate: "2026-03-01",
    status: "ISSUED",
    createdAt: "2026-02-12T11:35:00Z",
    deliveries: [],
  },
  {
    id: "po_2_biomed",
    poNumber: "PO-2026-002B",
    sourceOrderId: "ord_2",
    sourceOrderNumber: "ORD-2026-002",
    requisitionId: "req_2",
    requisitionNumber: "REQ-2026-002",
    supplierId: "sup_1",
    supplierName: "BioMed Global Supply Ltd",
    supplierEmail: "orders@biomedglobal.co.uk",
    supplierPhone: "+44 1223 892100",
    supplierAddress: "14 Cavendish Way, Cambridge CB24 9ZR, United Kingdom",
    items: [
      {
        id: "item_2_2",
        category: "PARTS",
        description: "Sterile Ultrasound Needle Guides (Box of 20 packs)",
        specifications: "Compatible with ACUSON 4Z1c",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 20,
        numberOfPacks: 5,
        totalQuantity: 100,
        unitPrice: 25000,
        totalPrice: 2500000,
        vatPercent: 7.5,
        vatAmount: 187500,
        grossTotal: 2687500,
        orderedQuantity: 100,
        fulfilledQuantity: 0,
        remainingQuantity: 100,
      },
    ],
    totalPrice: 2500000,
    vatAmount: 187500,
    grossTotal: 2687500,
    targetDeliveryDate: "2026-03-01",
    status: "ISSUED",
    createdAt: "2026-02-12T11:35:00Z",
    deliveries: [],
  },
  {
    id: "po_4",
    poNumber: "PO-2026-004",
    sourceOrderId: "ord_11",
    sourceOrderNumber: "ORD-2026-011",
    requisitionId: "req_11",
    requisitionNumber: "REQ-2026-011",
    supplierId: "sup_1",
    supplierName: "BioMed Global Supply Ltd",
    supplierEmail: "orders@biomedglobal.co.uk",
    supplierPhone: "+44 1223 892100",
    items: [
      {
        id: "item_11_1",
        category: "PARTS",
        description: "Mindray BeneHeart D6 Defibrillator Lithium-Ion Battery Pack",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 4,
        totalQuantity: 4,
        unitPrice: 1250000,
        totalPrice: 5000000,
        vatPercent: 7.5,
        vatAmount: 375000,
        grossTotal: 5375000,
        orderedQuantity: 4,
        fulfilledQuantity: 0,
        remainingQuantity: 4,
      },
    ],
    totalPrice: 5000000,
    vatAmount: 375000,
    grossTotal: 5375000,
    targetDeliveryDate: "2026-03-12",
    status: "ISSUED",
    createdAt: "2026-02-21T14:10:00Z",
    deliveries: [],
  },
  {
    id: "po_5",
    poNumber: "PO-2026-005",
    sourceOrderId: "ord_12",
    sourceOrderNumber: "ORD-2026-012",
    requisitionId: "req_12",
    requisitionNumber: "REQ-2026-012",
    supplierId: "sup_3",
    supplierName: "Siemens Healthineers Logistics",
    supplierEmail: "spares.service@siemens-healthineers.com",
    items: [
      {
        id: "item_12_1",
        category: "PARTS",
        description: "Philips IntelliVue MP70 Main Motherboard PCB & Power Filter Assembly",
        supplierId: "sup_3",
        supplierName: "Siemens Healthineers Logistics",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 5600000,
        totalPrice: 11200000,
        vatPercent: 7.5,
        vatAmount: 840000,
        grossTotal: 12040000,
        orderedQuantity: 2,
        fulfilledQuantity: 1,
        remainingQuantity: 1,
      },
    ],
    totalPrice: 11200000,
    vatAmount: 840000,
    grossTotal: 12040000,
    targetDeliveryDate: "2026-03-15",
    status: "PARTIALLY_FULFILLED",
    createdAt: "2026-02-23T11:05:00Z",
    deliveries: [
      {
        id: "del_5_1",
        poId: "po_5",
        poNumber: "PO-2026-005",
        orderId: "ord_12",
        orderNumber: "ORD-2026-012",
        deliveryDate: "2026-03-01T10:00:00Z",
        deliveryNoteNumber: "DN-SH-4091",
        receivedBy: "Ngozi Adeleke (Admin)",
        receivedById: "acc_008",
        itemsReceived: [
          {
            orderItemId: "item_12_1",
            description: "Philips IntelliVue MP70 Main Motherboard PCB",
            quantityReceived: 1,
          },
        ],
        isAccurate: true,
        notes: "1 of 2 units received. Backorder confirmed for second PCB.",
      },
    ],
  },
  {
    id: "po_6",
    poNumber: "PO-2026-006",
    sourceOrderId: "ord_15",
    sourceOrderNumber: "ORD-2026-015",
    requisitionId: "req_15",
    requisitionNumber: "REQ-2026-015",
    supplierId: "sup_1",
    supplierName: "BioMed Global Supply Ltd",
    items: [
      {
        id: "item_15_1",
        category: "PARTS",
        description: "Draeger Evita Infinity V500 Exhalation Valve Assembly",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 3,
        totalQuantity: 3,
        unitPrice: 1800000,
        totalPrice: 5400000,
        vatPercent: 7.5,
        vatAmount: 405000,
        grossTotal: 5805000,
        orderedQuantity: 3,
        fulfilledQuantity: 3,
        remainingQuantity: 0,
      },
    ],
    totalPrice: 5400000,
    vatAmount: 405000,
    grossTotal: 5805000,
    targetDeliveryDate: "2026-02-15",
    status: "COMPLETED",
    createdAt: "2026-01-20T10:00:00Z",
    deliveries: [],
  },
  {
    id: "po_7",
    poNumber: "PO-2026-007",
    sourceOrderId: "ord_16",
    sourceOrderNumber: "ORD-2026-016",
    requisitionId: "req_16",
    requisitionNumber: "REQ-2026-016",
    supplierId: "sup_1",
    supplierName: "BioMed Global Supply Ltd",
    items: [
      {
        id: "item_16_1",
        category: "TOOLS",
        description: "Fluke Biomedical Impulse 7000DP Defibrillator Analyzer Leads",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 2800000,
        totalPrice: 2800000,
        vatPercent: 7.5,
        vatAmount: 210000,
        grossTotal: 3010000,
        orderedQuantity: 1,
        fulfilledQuantity: 1,
        remainingQuantity: 0,
      },
    ],
    totalPrice: 2800000,
    vatAmount: 210000,
    grossTotal: 3010000,
    targetDeliveryDate: "2026-02-18",
    status: "COMPLETED",
    createdAt: "2026-01-25T11:00:00Z",
    deliveries: [],
  },
  {
    id: "po_8",
    poNumber: "PO-2026-008",
    sourceOrderId: "ord_17",
    sourceOrderNumber: "ORD-2026-017",
    requisitionId: "req_17",
    requisitionNumber: "REQ-2026-017",
    supplierId: "sup_2",
    supplierName: "GE Healthcare Direct",
    items: [
      {
        id: "item_17_1",
        category: "PARTS",
        description: "Olympus GIF-H190 Video Gastroscope Light Guide Insertion Tube",
        supplierId: "sup_2",
        supplierName: "GE Healthcare Direct",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 7200000,
        totalPrice: 7200000,
        vatPercent: 7.5,
        vatAmount: 540000,
        grossTotal: 7740000,
        orderedQuantity: 1,
        fulfilledQuantity: 1,
        remainingQuantity: 0,
      },
    ],
    totalPrice: 7200000,
    vatAmount: 540000,
    grossTotal: 7740000,
    targetDeliveryDate: "2026-02-20",
    status: "COMPLETED",
    createdAt: "2026-01-28T14:00:00Z",
    deliveries: [],
  },
  {
    id: "po_9",
    poNumber: "PO-2026-009",
    sourceOrderId: "ord_18",
    sourceOrderNumber: "ORD-2026-018",
    requisitionId: "req_18",
    requisitionNumber: "REQ-2026-018",
    supplierId: "sup_2",
    supplierName: "GE Healthcare Direct",
    items: [
      {
        id: "item_18_1",
        category: "PARTS",
        description: "GE Healthcare Aisys CS2 Flow Sensor Module & Cassette",
        supplierId: "sup_2",
        supplierName: "GE Healthcare Direct",
        quantityInPack: 2,
        numberOfPacks: 2,
        totalQuantity: 4,
        unitPrice: 1950000,
        totalPrice: 7800000,
        vatPercent: 7.5,
        vatAmount: 585000,
        grossTotal: 8385000,
        orderedQuantity: 4,
        fulfilledQuantity: 4,
        remainingQuantity: 0,
      },
    ],
    totalPrice: 7800000,
    vatAmount: 585000,
    grossTotal: 8385000,
    targetDeliveryDate: "2026-02-22",
    status: "COMPLETED",
    createdAt: "2026-02-01T09:00:00Z",
    deliveries: [],
  },
  {
    id: "po_10",
    poNumber: "PO-2026-010",
    sourceOrderId: "ord_23",
    sourceOrderNumber: "ORD-2026-023",
    requisitionId: "req_23",
    requisitionNumber: "REQ-2026-023",
    supplierId: "sup_1",
    supplierName: "BioMed Global Supply Ltd",
    items: [
      {
        id: "item_23_1",
        category: "PARTS",
        description: "Karl Storz Telecam C3 Endoscopy Camera Head Fiber Light Cable",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 4100000,
        totalPrice: 8200000,
        vatPercent: 7.5,
        vatAmount: 615000,
        grossTotal: 8815000,
        orderedQuantity: 2,
        fulfilledQuantity: 0,
        remainingQuantity: 2,
      },
    ],
    totalPrice: 8200000,
    vatAmount: 615000,
    grossTotal: 8815000,
    targetDeliveryDate: "2026-03-18",
    status: "ISSUED",
    createdAt: "2026-03-05T12:05:00Z",
    deliveries: [],
  },
  {
    id: "po_11",
    poNumber: "PO-2026-011",
    sourceOrderId: "ord_24",
    sourceOrderNumber: "ORD-2026-024",
    requisitionId: "req_24",
    requisitionNumber: "REQ-2026-024",
    supplierId: "sup_1",
    supplierName: "BioMed Global Supply Ltd",
    items: [
      {
        id: "item_24_1",
        category: "PARTS",
        description: "Sevoflurane Vaporizer Service Kit & O-Ring Overhaul Pack",
        supplierId: "sup_1",
        supplierName: "BioMed Global Supply Ltd",
        quantityInPack: 1,
        numberOfPacks: 2,
        totalQuantity: 2,
        unitPrice: 2100000,
        totalPrice: 4200000,
        vatPercent: 7.5,
        vatAmount: 315000,
        grossTotal: 4515000,
        orderedQuantity: 2,
        fulfilledQuantity: 2,
        remainingQuantity: 0,
      },
    ],
    totalPrice: 4200000,
    vatAmount: 315000,
    grossTotal: 4515000,
    targetDeliveryDate: "2026-03-01",
    status: "COMPLETED",
    createdAt: "2026-02-20T14:05:00Z",
    deliveries: [],
  },
  {
    id: "po_12",
    poNumber: "PO-2026-012",
    sourceOrderId: "ord_34",
    sourceOrderNumber: "ORD-2026-034",
    requisitionId: "req_34",
    requisitionNumber: "REQ-2026-034",
    supplierId: "sup_3",
    supplierName: "Siemens Healthineers Logistics",
    items: [
      {
        id: "item_34_1",
        category: "PARTS",
        description: "Siemens Cios Alpha High-Flex Shielded Gantry Cable Harness",
        supplierId: "sup_3",
        supplierName: "Siemens Healthineers Logistics",
        quantityInPack: 1,
        numberOfPacks: 1,
        totalQuantity: 1,
        unitPrice: 9400000,
        totalPrice: 9400000,
        vatPercent: 7.5,
        vatAmount: 705000,
        grossTotal: 10105000,
        orderedQuantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
      },
    ],
    totalPrice: 9400000,
    vatAmount: 705000,
    grossTotal: 10105000,
    targetDeliveryDate: "2026-03-20",
    status: "ISSUED",
    createdAt: "2026-03-03T11:05:00Z",
    deliveries: [],
  },
];

class FinancialService {
  private orders: Order[] = [];
  private purchaseOrders: PurchaseOrder[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") {
      this.orders = [...INITIAL_ORDERS];
      this.purchaseOrders = [...INITIAL_POS];
      return;
    }

    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        this.orders = JSON.parse(storedOrders);
      } else {
        this.orders = [...INITIAL_ORDERS];
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
      }

      const storedPos = localStorage.getItem(POS_STORAGE_KEY);
      if (storedPos) {
        this.purchaseOrders = JSON.parse(storedPos);
      } else {
        this.purchaseOrders = [...INITIAL_POS];
        localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(this.purchaseOrders));
      }
    } catch {
      this.orders = [...INITIAL_ORDERS];
      this.purchaseOrders = [...INITIAL_POS];
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(this.purchaseOrders));
    } catch (e) {
      console.error("Failed to save financial data to storage", e);
    }
  }

  // ── Orders API ─────────────────────────────────────────────────────────────

  async getOrders(filters?: {
    search?: string;
    category?: string;
    status?: string;
    includeArchived?: boolean;
    userId?: string;
  }): Promise<Order[]> {
    let result = [...this.orders];

    if (!filters?.includeArchived) {
      result = result.filter((o) => !o.isArchived);
    }

    if (filters?.category && filters.category !== "all") {
      result = result.filter((o) => o.category === filters.category);
    }

    if (filters?.status && filters.status !== "all") {
      result = result.filter((o) => o.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.requestedByName.toLowerCase().includes(q) ||
          (o.jobNumber && o.jobNumber.toLowerCase().includes(q)) ||
          (o.jobTitle && o.jobTitle.toLowerCase().includes(q)) ||
          (o.notes && o.notes.toLowerCase().includes(q)) ||
          o.items.some(
            (item) =>
              item.description.toLowerCase().includes(q) ||
              item.supplierName.toLowerCase().includes(q) ||
              (item.partNumber && item.partNumber.toLowerCase().includes(q)),
          ),
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.find((o) => o.id === id);
  }

  async createOrder(input: CreateOrderInput, user: User, isDraft = false): Promise<Order> {
    const nextSeq = this.orders.length + 1;
    const orderNumber = `ORD-2026-${String(nextSeq).padStart(3, "0")}`;
    const now = new Date().toISOString();

    const items: OrderItem[] = input.items.map((item, idx) => {
      const quantityInPack = item.quantityInPack || 1;
      const numberOfPacks = item.numberOfPacks || 1;
      const totalQuantity =
        item.category === "PARTS" || item.category === "TOOLS"
          ? (item.quantityInPack ?? 1) * (item.numberOfPacks ?? 1)
          : item.totalQuantity || 1;

      const unitPrice = item.unitPrice || 0;
      const totalPrice = totalQuantity * unitPrice;
      const vatPercent = typeof item.vatPercent === "number" ? item.vatPercent : 7.5;
      const vatAmount = totalPrice * (vatPercent / 100);
      const grossTotal = totalPrice + vatAmount;

      return {
        id: `item_${Date.now()}_${idx}`,
        category: item.category,
        partId: item.partId,
        partNumber: item.partNumber,
        description: item.description,
        specifications: item.specifications,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        supplierEmail: item.supplierEmail,
        supplierPhone: item.supplierPhone,
        supplierAddress: item.supplierAddress,
        quantityInPack,
        numberOfPacks,
        totalQuantity,
        unitPrice,
        totalPrice,
        vatPercent,
        vatAmount,
        grossTotal,
        orderedQuantity: totalQuantity,
        fulfilledQuantity: 0,
        remainingQuantity: totalQuantity,
        targetDeliveryDate: item.targetDeliveryDate || input.targetDeliveryDate,
      };
    });

    const totalPrice = items.reduce((acc, i) => acc + i.totalPrice, 0);
    const vatAmount = items.reduce((acc, i) => acc + i.vatAmount, 0);
    const grossTotal = items.reduce((acc, i) => acc + i.grossTotal, 0);

    const initialHistory: ApprovalHistoryEntry[] = [
      {
        id: `hist_${Date.now()}_1`,
        action: "Created",
        performedBy: `${user.firstName} ${user.lastName}`,
        performedById: user.id,
        timestamp: now,
      },
    ];

    if (!isDraft) {
      initialHistory.push({
        id: `hist_${Date.now()}_2`,
        action: "Submitted",
        performedBy: `${user.firstName} ${user.lastName}`,
        performedById: user.id,
        timestamp: now,
      });
    }

    const order: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      status: isDraft ? "DRAFT" : "SUBMITTED",
      category: input.category,
      dateRaised: now,
      requestedById: input.requestedById || user.id,
      requestedByName: input.requestedByName || `${user.firstName} ${user.lastName}`,
      targetDeliveryDate: input.targetDeliveryDate,
      jobId: input.jobId,
      jobNumber: input.jobNumber,
      jobTitle: input.jobTitle,
      assetId: input.assetId,
      assetName: input.assetName,
      items,
      totalPrice,
      vatAmount,
      grossTotal,
      notes: input.notes,
      documents: (input.documents || []).map((doc, idx) => ({
        id: `doc_${Date.now()}_${idx}`,
        ...doc,
        uploadDate: now,
      })),
      history: initialHistory,
      isArchived: false,
      createdAt: now,
      submittedAt: !isDraft ? now : undefined,
    };

    this.orders.unshift(order);
    this.saveToStorage();
    return order;
  }

  async updateOrder(
    id: string,
    input: Partial<CreateOrderInput>,
    user: User,
    resubmit = false,
  ): Promise<Order> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);

    if (order.status !== "DRAFT" && order.status !== "SENT_BACK") {
      throw new Error(`Order ${order.orderNumber} is currently ${order.status} and cannot be edited directly.`);
    }

    const now = new Date().toISOString();

    if (input.requestedById) order.requestedById = input.requestedById;
    if (input.requestedByName) order.requestedByName = input.requestedByName;
    if (input.category) order.category = input.category;
    if (input.targetDeliveryDate) order.targetDeliveryDate = input.targetDeliveryDate;
    if (input.jobId !== undefined) {
      order.jobId = input.jobId;
      order.jobNumber = input.jobNumber;
      order.jobTitle = input.jobTitle;
    }
    if (input.assetId !== undefined) {
      order.assetId = input.assetId;
      order.assetName = input.assetName;
    }
    if (input.notes !== undefined) order.notes = input.notes;

    if (input.items && input.items.length > 0) {
      order.items = input.items.map((item, idx) => {
        const quantityInPack = item.quantityInPack || 1;
        const numberOfPacks = item.numberOfPacks || 1;
        const totalQuantity =
          (item.category === "PARTS" || item.category === "TOOLS") && item.numberOfPacks
            ? quantityInPack * numberOfPacks
            : item.totalQuantity || 1;

        const unitPrice = item.unitPrice || 0;
        const totalPrice = totalQuantity * unitPrice;
        const vatPercent = typeof item.vatPercent === "number" ? item.vatPercent : 7.5;
        const vatAmount = totalPrice * (vatPercent / 100);
        const grossTotal = totalPrice + vatAmount;

        return {
          id: `item_${Date.now()}_${idx}`,
          category: item.category,
          partId: item.partId,
          partNumber: item.partNumber,
          description: item.description,
          specifications: item.specifications,
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          supplierEmail: item.supplierEmail,
          supplierPhone: item.supplierPhone,
          supplierAddress: item.supplierAddress,
          quantityInPack,
          numberOfPacks,
          totalQuantity,
          unitPrice,
          totalPrice,
          vatPercent,
          vatAmount,
          grossTotal,
          orderedQuantity: totalQuantity,
          fulfilledQuantity: 0,
          remainingQuantity: totalQuantity,
          targetDeliveryDate: item.targetDeliveryDate || order.targetDeliveryDate,
        };
      });

      order.totalPrice = order.items.reduce((acc, i) => acc + i.totalPrice, 0);
      order.vatAmount = order.items.reduce((acc, i) => acc + i.vatAmount, 0);
      order.grossTotal = order.items.reduce((acc, i) => acc + i.grossTotal, 0);
    }

    if (input.documents) {
      order.documents = input.documents.map((doc, idx) => ({
        id: `doc_${Date.now()}_${idx}`,
        ...doc,
        uploadDate: now,
      }));
    }

    if (resubmit || (order.status === "SENT_BACK" && resubmit)) {
      order.status = "SUBMITTED";
      order.submittedAt = now;
      order.sendBackReason = undefined;
      order.history.unshift({
        id: `hist_${Date.now()}`,
        action: "Resubmitted",
        performedBy: `${user.firstName} ${user.lastName}`,
        performedById: user.id,
        timestamp: now,
        note: "Information updated by user and resubmitted for admin review.",
      });
    }

    this.saveToStorage();
    return order;
  }

  async submitOrder(id: string, user: User): Promise<Order> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);

    const now = new Date().toISOString();
    const action = order.status === "SENT_BACK" ? "Resubmitted" : "Submitted";
    order.status = "SUBMITTED";
    order.submittedAt = now;
    order.sendBackReason = undefined;

    order.history.unshift({
      id: `hist_${Date.now()}`,
      action,
      performedBy: `${user.firstName} ${user.lastName}`,
      performedById: user.id,
      timestamp: now,
    });

    this.saveToStorage();
    return order;
  }

  async sendBackOrder(id: string, reason: string, user: User): Promise<Order> {
    if (!reason || !reason.trim()) {
      throw new Error("A send-back reason/note is required.");
    }

    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);

    const now = new Date().toISOString();
    order.status = "SENT_BACK";
    order.sendBackReason = reason.trim();

    order.history.unshift({
      id: `hist_${Date.now()}`,
      action: "Sent Back",
      performedBy: `${user.firstName} ${user.lastName} (Admin)`,
      performedById: user.id,
      timestamp: now,
      note: reason.trim(),
    });

    this.saveToStorage();
    return order;
  }

  async approveOrder(id: string, user: User, note?: string): Promise<Order> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);

    const now = new Date().toISOString();
    order.status = "APPROVED";
    order.approvedAt = now;
    order.requisitionedAt = now;

    const requisitionNumber = `REQ-2026-${order.orderNumber.replace("ORD-2026-", "")}`;
    const requisition: Requisition = {
      id: `req_${Date.now()}`,
      requisitionNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      generatedAt: now,
      status: "PENDING_FINAL_APPROVAL",
      notes: note,
    };
    order.requisition = requisition;

    order.history.unshift(
      {
        id: `hist_${Date.now()}_1`,
        action: "Approved",
        performedBy: `${user.firstName} ${user.lastName} (Admin)`,
        performedById: user.id,
        timestamp: now,
        note,
      },
      {
        id: `hist_${Date.now()}_2`,
        action: "Requisition Generated",
        performedBy: `${user.firstName} ${user.lastName} (Admin)`,
        performedById: user.id,
        timestamp: now,
        note: `Internal requisition ${requisitionNumber} generated.`,
      },
    );

    this.saveToStorage();
    return order;
  }

  async finalApproveOrder(id: string, user: User, note?: string): Promise<{ order: Order; pos: PurchaseOrder[] }> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);

    if (order.status !== "APPROVED") {
      throw new Error(`Order must be approved before final authorization.`);
    }

    const now = new Date().toISOString();
    order.status = "PO_CREATED";
    order.finalApprovedAt = now;
    order.poCreatedAt = now;

    if (order.requisition) {
      order.requisition.status = "FINAL_APPROVED";
      order.requisition.approvedAt = now;
      order.requisition.approvedBy = `${user.firstName} ${user.lastName} (Admin)`;
    }

    // Group items by supplier to generate supplier-specific POs
    const supplierGroups: Record<string, OrderItem[]> = {};
    order.items.forEach((item) => {
      const sId = item.supplierId || "general_vendor";
      if (!supplierGroups[sId]) supplierGroups[sId] = [];
      supplierGroups[sId].push(item);
    });

    const supplierEntries = Object.entries(supplierGroups);
    const newPos: PurchaseOrder[] = [];
    const createdPoIds: string[] = [];

    supplierEntries.forEach(([sId, items], index) => {
      const suffix = supplierEntries.length > 1 ? String.fromCharCode(65 + index) : "";
      const poSeq = this.purchaseOrders.length + index + 1;
      const poNumber = `PO-2026-${String(poSeq).padStart(3, "0")}${suffix}`;

      const sName = items[0]?.supplierName || "Selected Supplier";
      const sEmail = items[0]?.supplierEmail;
      const sPhone = items[0]?.supplierPhone;
      const sAddress = items[0]?.supplierAddress;

      const subTotal = items.reduce((acc, i) => acc + i.totalPrice, 0);
      const vat = items.reduce((acc, i) => acc + i.vatAmount, 0);
      const gross = items.reduce((acc, i) => acc + i.grossTotal, 0);

      const po: PurchaseOrder = {
        id: `po_${Date.now()}_${index}`,
        poNumber,
        sourceOrderId: order.id,
        sourceOrderNumber: order.orderNumber,
        requisitionId: order.requisition?.id || `req_${Date.now()}`,
        requisitionNumber: order.requisition?.requisitionNumber || "REQ-AUTO",
        supplierId: sId,
        supplierName: sName,
        supplierEmail: sEmail,
        supplierPhone: sPhone,
        supplierAddress: sAddress,
        items: items.map((it) => ({ ...it })),
        totalPrice: subTotal,
        vatAmount: vat,
        grossTotal: gross,
        targetDeliveryDate: order.targetDeliveryDate,
        status: "ISSUED",
        createdAt: now,
        deliveries: [],
      };

      newPos.push(po);
      createdPoIds.push(po.id);
      this.purchaseOrders.unshift(po);
    });

    order.purchaseOrderIds = createdPoIds;

    order.history.unshift(
      {
        id: `hist_${Date.now()}_1`,
        action: "Final Approved",
        performedBy: `${user.firstName} ${user.lastName} (Admin)`,
        performedById: user.id,
        timestamp: now,
        note,
      },
      {
        id: `hist_${Date.now()}_2`,
        action: "PO Generated",
        performedBy: `${user.firstName} ${user.lastName} (Admin)`,
        performedById: user.id,
        timestamp: now,
        note: `Generated ${newPos.length} supplier-specific Purchase Order(s): ${newPos.map((p) => p.poNumber).join(", ")}.`,
      },
    );

    this.saveToStorage();
    return { order, pos: newPos };
  }

  // ── Purchase Orders & Delivery Receipts ────────────────────────────────────

  async getPurchaseOrders(filters?: {
    search?: string;
    status?: string;
    supplierId?: string;
  }): Promise<PurchaseOrder[]> {
    let list = [...this.purchaseOrders];

    if (filters?.status && filters.status !== "all") {
      list = list.filter((p) => p.status === filters.status);
    }

    if (filters?.supplierId) {
      list = list.filter((p) => p.supplierId === filters.supplierId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.poNumber.toLowerCase().includes(q) ||
          p.sourceOrderNumber.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.items.some((i) => i.description.toLowerCase().includes(q)),
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | undefined> {
    return this.purchaseOrders.find((p) => p.id === id);
  }

  async recordDelivery(input: RecordDeliveryInput, user: User): Promise<{ po: PurchaseOrder; order: Order }> {
    const po = this.purchaseOrders.find((p) => p.id === input.poId);
    if (!po) throw new Error(`Purchase order ${input.poId} not found`);

    const order = this.orders.find((o) => o.id === po.sourceOrderId);
    if (!order) throw new Error(`Source order ${po.sourceOrderId} not found`);

    const now = new Date().toISOString();

    const deliveredItemsReceipt: DeliveryRecord["itemsReceived"] = [];

    for (const receipt of input.itemsReceived) {
      const qty = receipt.quantityReceived;
      if (qty <= 0) continue;

      // Update in PO items
      const poItem = po.items.find((it) => it.id === receipt.orderItemId);
      if (poItem) {
        poItem.fulfilledQuantity = Math.min(poItem.orderedQuantity, poItem.fulfilledQuantity + qty);
        poItem.remainingQuantity = Math.max(0, poItem.orderedQuantity - poItem.fulfilledQuantity);
      }

      // Update in source Order items
      const orderItem = order.items.find((it) => it.id === receipt.orderItemId);
      if (orderItem) {
        orderItem.fulfilledQuantity = Math.min(orderItem.orderedQuantity, orderItem.fulfilledQuantity + qty);
        orderItem.remainingQuantity = Math.max(0, orderItem.orderedQuantity - orderItem.fulfilledQuantity);

        deliveredItemsReceipt.push({
          orderItemId: orderItem.id,
          partId: orderItem.partId,
          description: orderItem.description,
          quantityReceived: qty,
        });

        // ── PARTS INVENTORY INTEGRATION ─────────────────────────────────────
        // Physical receipt increases inventory if item is linked to Parts
        if (orderItem.category === "PARTS" && orderItem.partId) {
          try {
            await partsService.recordMovement({
              partId: orderItem.partId,
              type: "received",
              quantity: qty,
              referenceNumber: po.poNumber,
              performedBy: `${user.firstName} ${user.lastName}`,
              notes: `Received against Purchase Order ${po.poNumber} (Delivery note: ${input.deliveryNoteNumber || "N/A"})`,
            });
          } catch (invErr) {
            console.warn(`Could not sync stock movement for part ${orderItem.partId}:`, invErr);
          }
        }
      }
    }

    // Determine PO completion status
    const allPoItemsFulfilled = po.items.every((it) => it.remainingQuantity === 0);
    po.status = allPoItemsFulfilled ? "COMPLETED" : "PARTIALLY_FULFILLED";

    const deliveryRecord: DeliveryRecord = {
      id: `del_${Date.now()}`,
      poId: po.id,
      poNumber: po.poNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      deliveryDate: input.deliveryDate || now,
      deliveryNoteNumber: input.deliveryNoteNumber,
      receivedBy: `${user.firstName} ${user.lastName} (Admin)`,
      receivedById: user.id,
      itemsReceived: deliveredItemsReceipt,
      isAccurate: input.isAccurate,
      accuracyNotes: input.accuracyNotes,
      notes: input.notes,
    };

    po.deliveries.push(deliveryRecord);

    // Update source Order fulfillment status & timestamps
    if (!order.firstDeliveryAt) {
      order.firstDeliveryAt = now;
    }

    const allOrderItemsFulfilled = order.items.every((it) => it.remainingQuantity === 0);
    if (allOrderItemsFulfilled) {
      order.status = "COMPLETED";
      order.completedAt = now;
      order.actualCompletionDate = now;
    } else {
      order.status = "PARTIALLY_FULFILLED";
    }

    // Add delivery note document to order if reference provided
    if (input.deliveryNoteNumber) {
      order.documents.push({
        id: `doc_del_${Date.now()}`,
        type: "Delivery Note",
        fileName: `Delivery_Note_${input.deliveryNoteNumber}.pdf`,
        fileSize: "Recorded",
        uploadDate: now,
      });
    }

    order.history.unshift({
      id: `hist_${Date.now()}`,
      action: "Delivery Recorded",
      performedBy: `${user.firstName} ${user.lastName} (Admin)`,
      performedById: user.id,
      timestamp: now,
      note: `Received delivery for ${po.poNumber} (${input.deliveryNoteNumber || "No DN#"}). Status: ${po.status}. Accuracy confirmed: ${input.isAccurate ? "Yes" : "Discrepancy noted"}.`,
    });

    this.saveToStorage();
    return { po, order };
  }

  // ── Archive API ────────────────────────────────────────────────────────────

  async archiveOrder(id: string, user: User): Promise<Order> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);

    const now = new Date().toISOString();
    order.isArchived = true;
    order.archivedAt = now;
    order.archivedBy = `${user.firstName} ${user.lastName} (Admin)`;

    order.history.unshift({
      id: `hist_${Date.now()}`,
      action: "Archived",
      performedBy: `${user.firstName} ${user.lastName} (Admin)`,
      performedById: user.id,
      timestamp: now,
      note: "Order moved to archive repository. Record and audit trails preserved.",
    });

    this.saveToStorage();
    return order;
  }

  async unarchiveOrder(id: string, user: User): Promise<Order> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);

    const now = new Date().toISOString();
    order.isArchived = false;
    order.archivedAt = undefined;
    order.archivedBy = undefined;

    order.history.unshift({
      id: `hist_${Date.now()}`,
      action: "Unarchived",
      performedBy: `${user.firstName} ${user.lastName} (Admin)`,
      performedById: user.id,
      timestamp: now,
      note: "Order restored to active views.",
    });

    this.saveToStorage();
    return order;
  }

  // ── Financial Dashboard Metrics ────────────────────────────────────────────

  async getDashboardMetrics(): Promise<FinancialDashboardMetrics> {
    const activeOrders = this.orders.filter((o) => !o.isArchived);

    // 1. Total Order Value: Sum across active orders
    const totalOrderValue = activeOrders.reduce((sum, o) => sum + o.grossTotal, 0);

    // 2. OTIF: On-Time, In-Full
    // Completed orders delivered by target date
    const completedOrders = activeOrders.filter((o) => o.status === "COMPLETED");
    let onTimeInFullCount = 0;

    completedOrders.forEach((o) => {
      const target = new Date(o.targetDeliveryDate);
      const actual = o.actualCompletionDate ? new Date(o.actualCompletionDate) : new Date(o.completedAt || "");
      // Delivered on or before the target date
      if (actual.getTime() <= target.getTime() + 86400000) {
        onTimeInFullCount++;
      }
    });

    const otifRate =
      completedOrders.length > 0 ? Math.round((onTimeInFullCount / completedOrders.length) * 100) : 100;

    // 3. Order Cycle Time: Average days between CreatedAt and CompletedAt
    let totalCycleDays = 0;
    completedOrders.forEach((o) => {
      const start = new Date(o.createdAt).getTime();
      const end = new Date(o.completedAt || o.actualCompletionDate || o.createdAt).getTime();
      const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      totalCycleDays += days;
    });

    const orderCycleTimeDays =
      completedOrders.length > 0 ? Math.round((totalCycleDays / completedOrders.length) * 10) / 10 : 14.5;

    // 4. Order Accuracy Rate: (Number of Accurate Orders / Total Orders Fulfilled) * 100
    // Check deliveries on completed/fulfilled orders
    let accurateFulfilledCount = 0;
    const fulfilledOrders = activeOrders.filter(
      (o) => o.status === "COMPLETED" || o.status === "PARTIALLY_FULFILLED",
    );

    fulfilledOrders.forEach((o) => {
      // Find POs related to this order
      const relatedPos = this.purchaseOrders.filter((p) => p.sourceOrderId === o.id);
      const allDeliveries = relatedPos.flatMap((p) => p.deliveries);
      // If order has deliveries and none was flagged inaccurate
      if (allDeliveries.length > 0) {
        const hasInaccuracy = allDeliveries.some((d) => d.isAccurate === false);
        if (!hasInaccuracy) accurateFulfilledCount++;
      } else {
        accurateFulfilledCount++;
      }
    });

    const orderAccuracyRate =
      fulfilledOrders.length > 0 ? Math.round((accurateFulfilledCount / fulfilledOrders.length) * 100) : 98;

    // Order Counts
    const ordersCount = {
      total: this.orders.length,
      draft: this.orders.filter((o) => o.status === "DRAFT" && !o.isArchived).length,
      submitted: this.orders.filter((o) => o.status === "SUBMITTED" && !o.isArchived).length,
      sentBack: this.orders.filter((o) => o.status === "SENT_BACK" && !o.isArchived).length,
      approved: this.orders.filter((o) => o.status === "APPROVED" && !o.isArchived).length,
      requisitioned: this.orders.filter((o) => o.status === "REQUISITIONED" && !o.isArchived).length,
      poCreated: this.orders.filter((o) => o.status === "PO_CREATED" && !o.isArchived).length,
      completed: this.orders.filter((o) => o.status === "COMPLETED" && !o.isArchived).length,
      archived: this.orders.filter((o) => o.isArchived).length,
    };

    const monthlyTrends = [
      { month: "Jan-26", orderValue: 42000000, otif: 98, cycleTimeDays: 10.5, accuracyRate: 98 },
      { month: "Feb-26", orderValue: 35500000, otif: 75, cycleTimeDays: 18.2, accuracyRate: 91 },
      { month: "Mar-26", orderValue: 48000000, otif: 85, cycleTimeDays: 14.0, accuracyRate: 94 },
      { month: "Apr-26", orderValue: 51200000, otif: 95, cycleTimeDays: 11.2, accuracyRate: 97 },
      { month: "May-26", orderValue: 39000000, otif: 74, cycleTimeDays: 17.5, accuracyRate: 89 },
      { month: "Jun-26", orderValue: 33500000, otif: 68, cycleTimeDays: 19.8, accuracyRate: 86 },
      { month: "Jul-26", orderValue: 44000000, otif: 75, cycleTimeDays: 16.0, accuracyRate: 92 },
      { month: "Aug-26", orderValue: 49500000, otif: 84, cycleTimeDays: 13.5, accuracyRate: 95 },
      { month: "Sep-26", orderValue: 56000000, otif: 91, cycleTimeDays: 11.8, accuracyRate: 97 },
      { month: "Oct-26", orderValue: 41000000, otif: 78, cycleTimeDays: 15.2, accuracyRate: 93 },
      { month: "Nov-26", orderValue: 53500000, otif: 89, cycleTimeDays: 12.0, accuracyRate: 96 },
      { month: "Dec-26", orderValue: totalOrderValue, otif: 82, cycleTimeDays: 14.5, accuracyRate: 94 },
    ];

    return {
      totalOrderValue,
      otifRate,
      orderCycleTimeDays,
      orderAccuracyRate,
      ordersCount,
      monthlyTrends,
    };
  }
}

export const financialService = new FinancialService();
