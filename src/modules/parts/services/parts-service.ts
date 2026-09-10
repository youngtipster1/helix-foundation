import {
  Part,
  Supplier,
  AuditItem,
  AuditRun,
  PartsDashboardMetrics,
  StockMovement,
  StockMovementType,
  PartLifecycleStatus,
} from "../types";

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "sup_1",
    name: "BioMed Global Supply Ltd",
    supplierCode: "BGS-UK-01",
    address: "14 Cavendish Way, Cambridge CB24 9ZR, United Kingdom",
    contactPerson: "Eleanor Wright",
    email: "orders@biomedglobal.co.uk",
    phone: "+44 1223 892100",
  },
  {
    id: "sup_2",
    name: "GE Healthcare Direct",
    supplierCode: "GEHC-EU-44",
    address: "Pollards Wood, Nightingales Lane, Chalfont St Giles HP8 4SP, UK",
    contactPerson: "Klaus Hoffmann",
    email: "spares.emea@gehealthcare.com",
    phone: "+44 800 032 5050",
  },
  {
    id: "sup_3",
    name: "Siemens Healthineers Logistics",
    supplierCode: "SHL-DE-09",
    address: "Henkestr. 127, 91052 Erlangen, Germany",
    contactPerson: "Martina Vogel",
    email: "spares.service@siemens-healthineers.com",
    phone: "+49 9131 84-0",
  },
  {
    id: "sup_4",
    name: "Philips Medical Parts Central",
    supplierCode: "PMPC-NL-88",
    address: "Veenpluis 4-6, 5684 PC Best, Netherlands",
    contactPerson: "Dirk van Dijk",
    email: "orders.europe@philips.com",
    phone: "+31 40 276 2000",
  },
  {
    id: "sup_5",
    name: "Canon Medical Systems Logistics",
    supplierCode: "CMSL-JP-12",
    address: "1385 Shimoishigami, Otawara-shi, Tochigi, Japan",
    contactPerson: "Kenji Sato",
    email: "global.spares@medical.canon",
    phone: "+81 287 26 6211",
  },
];

export const MOCK_PARTS: Part[] = [
  {
    id: "prt_1",
    partNumber: "PRT-CT-1021",
    oemVendorPartNumber: "GE-8849-01",
    brand: "GE Healthcare",
    category: "Generator Board",
    oem: "GE Healthcare",
    modality: "CT",
    model: "Revolution CT",
    description: "Dual Energy High-Voltage Inverter Control PCB Assembly for Revolution Apex",
    note: "Must be handled in ESD safe area. Critical CT subsystem.",
    quantityInStock: 4,
    minStockLevel: 2,
    maxStockLevel: 8,
    quantityOnOrder: 2,
    dateOfPurchase: "2025-06-15",
    shelfLifeMonths: 36,
    doesNotExpire: false,
    expiryDate: "2028-06-15",
    contactPhone: "+44 800 032 5050",
    supplierId: "sup_2",
    supplierName: "GE Healthcare Direct",
    quantityInPack: 1,
    leadTimeWeeks: 3,
    listPrice: 14500,
    vatPercent: 20,
    grossPrice: 17400,
    unitPrice: 14500,
    listPriceDate: "2026-01-10",
    orderNote: "Priority air freight guaranteed under service SLA Level 1",
    location: "Main Depot - Electronics Bay",
    binCode: "BIN-CT",
    binNumber: "12",
    column: "C",
    row: "3",
    locationNote: "ESD shelf rack 3, row C",
    pictureUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
    documents: [
      {
        id: "doc_1",
        name: "GE_CoC_Certificate_PRT-CT-1021.pdf",
        comment: "Factory Certificate of Conformance Batch #8819",
        uploadDate: "2025-06-15",
        selected: true,
      },
    ],
    status: "active",
    createdAt: "2025-06-15T10:00:00Z",
    updatedAt: "2026-08-20T14:30:00Z",
  },
  {
    id: "prt_2",
    partNumber: "PRT-MR-2044",
    oemVendorPartNumber: "SH-9921-A",
    brand: "Siemens Healthineers",
    category: "Cryogenics",
    oem: "Siemens Healthineers",
    modality: "MRI",
    model: "Magnetom Vida",
    description: "Coldhead Dual-Displacer Helium Recondensation Motor Assembly",
    note: "Zero boil-off coldhead compressor head. Requires cold vacuum coupling.",
    quantityInStock: 2,
    minStockLevel: 1,
    maxStockLevel: 4,
    quantityOnOrder: 1,
    dateOfPurchase: "2025-11-20",
    shelfLifeMonths: undefined,
    doesNotExpire: true,
    expiryDate: null,
    contactPhone: "+49 9131 84-0",
    supplierId: "sup_3",
    supplierName: "Siemens Healthineers Logistics",
    quantityInPack: 1,
    leadTimeWeeks: 4,
    listPrice: 28900,
    vatPercent: 20,
    grossPrice: 34680,
    unitPrice: 28900,
    listPriceDate: "2026-02-01",
    orderNote: "Heavy transport required. Palletized helium sealed.",
    location: "Depot A - Cold Vault",
    binCode: "BIN-MR",
    binNumber: "04",
    column: "M",
    row: "1",
    locationNote: "Ground reinforced floor stand",
    pictureUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
    documents: [
      {
        id: "doc_2",
        name: "Siemens_Displacer_Test_Cert_2025.pdf",
        comment: "Helium Pressure Test Approval",
        uploadDate: "2025-11-20",
        selected: true,
      },
    ],
    status: "active",
    createdAt: "2025-11-20T11:00:00Z",
    updatedAt: "2026-07-15T09:15:00Z",
  },
  {
    id: "prt_3",
    partNumber: "PRT-US-3051",
    oemVendorPartNumber: "PHI-X6-1-PROBE",
    brand: "Philips Healthcare",
    category: "Transducer",
    oem: "Philips",
    modality: "Ultrasound",
    model: "EPIQ 7",
    description: "X6-1 xMATRIX Array 3D/4D Cardiac Diagnostic Ultrasound Transducer Probe",
    note: "Acoustic lens requires inspection after each immersion disinfection.",
    quantityInStock: 5,
    minStockLevel: 2,
    maxStockLevel: 10,
    quantityOnOrder: 0,
    dateOfPurchase: "2025-08-10",
    shelfLifeMonths: 48,
    doesNotExpire: false,
    expiryDate: "2029-08-10",
    contactPhone: "+31 40 276 2000",
    supplierId: "sup_4",
    supplierName: "Philips Medical Parts Central",
    quantityInPack: 1,
    leadTimeWeeks: 2,
    listPrice: 9200,
    vatPercent: 20,
    grossPrice: 11040,
    unitPrice: 9200,
    listPriceDate: "2026-01-15",
    orderNote: "Sterile protective case packaging included",
    location: "Ultrasound Lab - Probe Cabinet",
    binCode: "BIN-US",
    binNumber: "02",
    column: "U",
    row: "4",
    locationNote: "Suspension hook rack 2",
    pictureUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80",
    documents: [
      {
        id: "doc_3",
        name: "Philips_Acoustic_Calibration_Report.pdf",
        comment: "Piezoelectric element sensitivity certification",
        uploadDate: "2025-08-10",
        selected: true,
      },
    ],
    status: "active",
    createdAt: "2025-08-10T14:20:00Z",
    updatedAt: "2026-08-01T16:45:00Z",
  },
  {
    id: "prt_4",
    partNumber: "PRT-XR-4019",
    oemVendorPartNumber: "CAN-DREX-882",
    brand: "Canon Medical Systems",
    category: "X-Ray Tube",
    oem: "Canon Medical",
    modality: "Cath Lab",
    model: "Alphenix Core+",
    description: "Liquid Metal Bearing Dual-Focal Spot High Heat Capacity X-Ray Tube Assembly",
    note: "High anode heat dissipation unit (3.0 MHU). Requires calibrated oil chiller loop.",
    quantityInStock: 1,
    minStockLevel: 1,
    maxStockLevel: 2,
    quantityOnOrder: 1,
    dateOfPurchase: "2026-01-18",
    shelfLifeMonths: 24,
    doesNotExpire: false,
    expiryDate: "2028-01-18",
    contactPhone: "+81 287 26 6211",
    supplierId: "sup_5",
    supplierName: "Canon Medical Systems Logistics",
    quantityInPack: 1,
    leadTimeWeeks: 6,
    listPrice: 52000,
    vatPercent: 20,
    grossPrice: 62400,
    unitPrice: 52000,
    listPriceDate: "2026-01-18",
    orderNote: "Specialized shockwatch shock indicator monitored air shipment",
    location: "Cath Lab Spares Vault",
    binCode: "BIN-XR",
    binNumber: "01",
    column: "X",
    row: "1",
    locationNote: "Reinforced crane pallet rack 1",
    pictureUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=400&q=80",
    documents: [
      {
        id: "doc_4",
        name: "Canon_Tube_Vacuum_Integrity_Cert.pdf",
        comment: "Vacuum bake-out and filament tolerance sheet",
        uploadDate: "2026-01-18",
        selected: true,
      },
    ],
    status: "active",
    createdAt: "2026-01-18T08:30:00Z",
    updatedAt: "2026-01-18T08:30:00Z",
  },
  {
    id: "prt_5",
    partNumber: "PRT-CT-1088",
    oemVendorPartNumber: "BGS-SR-771",
    brand: "BioMed Global Supply",
    category: "Slip Ring",
    oem: "Siemens Healthineers",
    modality: "CT",
    model: "Somatom Force",
    description: "Contactless High-Speed Optical Data Transmission Slip Ring Receiver Array",
    note: "Optical transceiver diode alignment is sensitive to particulate contamination.",
    quantityInStock: 3,
    minStockLevel: 1,
    maxStockLevel: 5,
    quantityOnOrder: 0,
    dateOfPurchase: "2025-09-05",
    shelfLifeMonths: 36,
    doesNotExpire: false,
    expiryDate: "2028-09-05",
    contactPhone: "+44 1223 892100",
    supplierId: "sup_1",
    supplierName: "BioMed Global Supply Ltd",
    quantityInPack: 1,
    leadTimeWeeks: 2,
    listPrice: 18500,
    vatPercent: 20,
    grossPrice: 22200,
    unitPrice: 18500,
    listPriceDate: "2026-02-10",
    orderNote: "Standard dispatch",
    location: "Main Depot - Electronics Bay",
    binCode: "BIN-CT",
    binNumber: "15",
    column: "C",
    row: "2",
    locationNote: "Antistatic bag shelf 2",
    pictureUrl: undefined,
    documents: [],
    status: "active",
    createdAt: "2025-09-05T13:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
  },
  {
    id: "prt_6",
    partNumber: "PRT-XR-4099",
    oemVendorPartNumber: "GE-DET-2200",
    brand: "GE Healthcare",
    category: "Detector",
    oem: "GE Healthcare",
    modality: "Cath Lab",
    model: "Innova IGS 530",
    description: "30x30cm Solid-State Digital Flat Panel X-Ray Image Detector (Amorphous Silicon)",
    note: "TFT photodiode array. Direct drop-in replacement panel.",
    quantityInStock: 1,
    minStockLevel: 1,
    maxStockLevel: 2,
    quantityOnOrder: 0,
    dateOfPurchase: "2025-10-12",
    shelfLifeMonths: 60,
    doesNotExpire: false,
    expiryDate: "2030-10-12",
    contactPhone: "+44 800 032 5050",
    supplierId: "sup_2",
    supplierName: "GE Healthcare Direct",
    quantityInPack: 1,
    leadTimeWeeks: 5,
    listPrice: 68000,
    vatPercent: 20,
    grossPrice: 81600,
    unitPrice: 68000,
    listPriceDate: "2026-01-05",
    orderNote: "High precision calibrated flat panel",
    location: "Cath Lab Spares Vault",
    binCode: "BIN-XR",
    binNumber: "03",
    column: "X",
    row: "2",
    locationNote: "Vertical padded fixture shelf",
    pictureUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80",
    documents: [],
    status: "active",
    createdAt: "2025-10-12T15:00:00Z",
    updatedAt: "2026-04-20T11:00:00Z",
  },
  {
    id: "prt_7",
    partNumber: "PRT-MR-2089",
    oemVendorPartNumber: "SH-FLT-004",
    brand: "Siemens Healthineers",
    category: "Filter",
    oem: "Siemens Healthineers",
    modality: "MRI",
    model: "Magnetom Sola",
    description: "Chilled Water Loop Particle and Deionizing Polishing Resin Filter Pack",
    note: "Replace during annual gradient coil chiller preventative service.",
    quantityInStock: 1,
    minStockLevel: 2,
    maxStockLevel: 12,
    quantityOnOrder: 4,
    dateOfPurchase: "2026-04-10",
    shelfLifeMonths: 12,
    doesNotExpire: false,
    expiryDate: "2027-04-10",
    contactPhone: "+49 9131 84-0",
    supplierId: "sup_3",
    supplierName: "Siemens Healthineers Logistics",
    quantityInPack: 4,
    leadTimeWeeks: 1,
    listPrice: 1200,
    vatPercent: 20,
    grossPrice: 1440,
    unitPrice: 300,
    listPriceDate: "2026-04-10",
    orderNote: "Regular stock schedule",
    location: "Mechanical Spares Bay",
    binCode: "BIN-MR",
    binNumber: "15",
    column: "M",
    row: "3",
    locationNote: "Rack 3 Shelf 2",
    pictureUrl: undefined,
    documents: [],
    status: "low_stock",
    createdAt: "2026-04-10T14:00:00Z",
    updatedAt: "2026-08-01T08:00:00Z",
  },
];

export const MOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "mov_1",
    partId: "prt_1",
    partNumber: "PRT-CT-1021",
    partName: "Dual Energy High-Voltage Inverter Control PCB",
    modality: "CT",
    type: "opening_balance",
    quantity: 6,
    balanceAfter: 6,
    referenceNumber: "INIT-2025",
    performedBy: "Klaus Hoffmann",
    date: "2025-06-15T09:00:00Z",
    notes: "Initial inventory migration for Revolution CT fleet",
  },
  {
    id: "mov_2",
    partId: "prt_1",
    partNumber: "PRT-CT-1021",
    partName: "Dual Energy High-Voltage Inverter Control PCB",
    modality: "CT",
    type: "issued",
    quantity: -2,
    balanceAfter: 4,
    referenceNumber: "WO-2026-081",
    performedBy: "Marcus Vance",
    date: "2026-02-14T11:30:00Z",
    notes: "Replaced blown inverter stage during emergency unscheduled maintenance",
  },
  {
    id: "mov_3",
    partId: "prt_2",
    partNumber: "PRT-MR-2044",
    partName: "Coldhead Dual-Displacer Helium Recondensation Motor",
    modality: "MRI",
    type: "opening_balance",
    quantity: 2,
    balanceAfter: 2,
    referenceNumber: "INIT-2025",
    performedBy: "Martina Vogel",
    date: "2025-11-20T08:00:00Z",
    notes: "Cold head maintenance batch",
  },
  {
    id: "mov_4",
    partId: "prt_3",
    partNumber: "PRT-US-3051",
    partName: "xMATRIX Array 3D/4D Cardiac Transducer Probe",
    modality: "Ultrasound",
    type: "opening_balance",
    quantity: 6,
    balanceAfter: 6,
    referenceNumber: "INIT-2025",
    performedBy: "Dirk van Dijk",
    date: "2025-08-10T10:00:00Z",
    notes: "EPIQ 7 ultrasound probe pool registration",
  },
  {
    id: "mov_5",
    partId: "prt_3",
    partNumber: "PRT-US-3051",
    partName: "xMATRIX Array 3D/4D Cardiac Transducer Probe",
    modality: "Ultrasound",
    type: "issued",
    quantity: -1,
    balanceAfter: 5,
    referenceNumber: "WO-2026-049",
    performedBy: "Dr. Elena Rostova",
    date: "2026-05-18T14:20:00Z",
    notes: "Deployed to Cardiac Cath Lab Echo Suite 2",
  },
  {
    id: "mov_6",
    partId: "prt_4",
    partNumber: "PRT-XR-4019",
    partName: "Liquid Metal Bearing Dual-Focal Spot X-Ray Tube",
    modality: "Cath Lab",
    type: "opening_balance",
    quantity: 1,
    balanceAfter: 1,
    referenceNumber: "INIT-2026",
    performedBy: "Kenji Sato",
    date: "2026-01-18T09:00:00Z",
    notes: "High-value spare cathode assembly",
  },
  {
    id: "mov_7",
    partId: "prt_7",
    partNumber: "PRT-MR-2089",
    partName: "Chilled Water Loop Particle and Deionizing Resin Filter",
    modality: "MRI",
    type: "opening_balance",
    quantity: 4,
    balanceAfter: 4,
    referenceNumber: "INIT-2026",
    performedBy: "Martina Vogel",
    date: "2026-04-10T14:00:00Z",
    notes: "Chiller consumables replenishment",
  },
  {
    id: "mov_8",
    partId: "prt_7",
    partNumber: "PRT-MR-2089",
    partName: "Chilled Water Loop Particle and Deionizing Resin Filter",
    modality: "MRI",
    type: "issued",
    quantity: -3,
    balanceAfter: 1,
    referenceNumber: "WO-2026-112",
    performedBy: "James O'Connor",
    date: "2026-07-29T16:45:00Z",
    notes: "Flushed and replaced primary coolant loop filters on Magnetom Sola",
  },
];

const HISTORICAL_TRENDS = [
  { date: "Dec-25", shrinkageValue: 250000, shrinkageQuantity: 52 },
  { date: "Jan-26", shrinkageValue: 310000, shrinkageQuantity: 27 },
  { date: "Feb-26", shrinkageValue: 120000, shrinkageQuantity: 12 },
  { date: "Mar-26", shrinkageValue: 500000, shrinkageQuantity: 48 },
  { date: "May-26", shrinkageValue: 0, shrinkageQuantity: 0 },
  { date: "Jun-26", shrinkageValue: 241000, shrinkageQuantity: 25 },
  { date: "Jul-26", shrinkageValue: 60150, shrinkageQuantity: 10 },
  { date: "Aug-26", shrinkageValue: 0, shrinkageQuantity: 0 },
  { date: "Oct-26", shrinkageValue: 15000, shrinkageQuantity: 1 },
  { date: "Nov-26", shrinkageValue: 34200, shrinkageQuantity: 3 },
  { date: "Dec-26", shrinkageValue: 124000, shrinkageQuantity: 24 },
];

class PartsService {
  private parts: Part[] = [...MOCK_PARTS];
  private suppliers: Supplier[] = [...MOCK_SUPPLIERS];
  private stockMovements: StockMovement[] = [...MOCK_MOVEMENTS];
  private auditHistory: AuditRun[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const savedParts = localStorage.getItem("hemp.parts.registry");
      if (savedParts) {
        this.parts = JSON.parse(savedParts);
      }
      const savedAudits = localStorage.getItem("hemp.parts.audits");
      if (savedAudits) {
        this.auditHistory = JSON.parse(savedAudits);
      }
      const savedMovements = localStorage.getItem("hemp.parts.movements");
      if (savedMovements) {
        this.stockMovements = JSON.parse(savedMovements);
      }
    } catch (e) {
      console.error("Failed to load parts from localStorage:", e);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("hemp.parts.registry", JSON.stringify(this.parts));
      localStorage.setItem("hemp.parts.audits", JSON.stringify(this.auditHistory));
      localStorage.setItem("hemp.parts.movements", JSON.stringify(this.stockMovements));
    } catch (e) {
      console.error("Failed to save parts to localStorage:", e);
    }
  }

  // ── Parts Registry ──────────────────────────────────────────────────────────

  async list(filters?: {
    search?: string;
    modality?: string;
    category?: string;
    oem?: string;
    includeArchived?: boolean;
  }): Promise<Part[]> {
    return this.getParts(filters);
  }

  async getParts(filters?: {
    search?: string;
    modality?: string;
    category?: string;
    oem?: string;
    includeArchived?: boolean;
  }): Promise<Part[]> {
    let result = this.parts.filter((p) =>
      filters?.includeArchived ? true : p.status !== "archived"
    );

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.partNumber.toLowerCase().includes(q) ||
          p.oemVendorPartNumber.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    if (filters?.modality && filters.modality !== "all") {
      result = result.filter((p) => p.modality === filters.modality);
    }

    if (filters?.category && filters.category !== "all") {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters?.oem && filters.oem !== "all") {
      result = result.filter((p) => p.oem === filters.oem);
    }

    return result;
  }

  async getById(id: string): Promise<Part | undefined> {
    return this.getPartById(id);
  }

  async getPartById(id: string): Promise<Part | undefined> {
    return this.parts.find((p) => p.id === id);
  }

  async create(data: Omit<Part, "id" | "createdAt" | "updatedAt" | "status">): Promise<Part> {
    return this.createPart(data);
  }

  async createPart(data: Omit<Part, "id" | "createdAt" | "updatedAt" | "status">): Promise<Part> {
    const now = new Date().toISOString();
    const initialQty = data.quantityInStock ?? 0;
    const initialStatus: PartLifecycleStatus =
      initialQty <= data.minStockLevel ? "low_stock" : "active";

    const newPart: Part = {
      ...data,
      id: `prt_${Date.now()}`,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    };
    this.parts.unshift(newPart);

    // Automatically record an opening stock movement in the ledger
    if (initialQty > 0) {
      const openingMovement: StockMovement = {
        id: `mov_${Date.now()}`,
        partId: newPart.id,
        partNumber: newPart.partNumber,
        partName: newPart.model || newPart.partNumber,
        modality: newPart.modality,
        type: "opening_balance",
        quantity: initialQty,
        balanceAfter: initialQty,
        referenceNumber: `INIT-${new Date().getFullYear()}`,
        performedBy: "System Administrator",
        date: now,
        notes: "Initial inventory setup on part creation",
      };
      this.stockMovements.unshift(openingMovement);
    }

    this.saveToStorage();
    return newPart;
  }

  async update(id: string, updates: Partial<Part>): Promise<Part> {
    return this.updatePart(id, updates);
  }

  async updatePart(id: string, updates: Partial<Part>): Promise<Part> {
    const idx = this.parts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Part ${id} not found`);

    const updated = {
      ...this.parts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.parts[idx] = updated;
    this.saveToStorage();
    return updated;
  }

  async archive(id: string, archivedBy?: string): Promise<void> {
    return this.archivePart(id);
  }

  async archivePart(id: string): Promise<void> {
    const part = this.parts.find((p) => p.id === id);
    if (part) {
      part.status = "archived";
      part.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  // ── Stock Movements Ledger ──────────────────────────────────────────────────

  async listMovements(filters?: {
    partId?: string;
    type?: StockMovementType | "all";
  }): Promise<StockMovement[]> {
    let list = [...this.stockMovements];
    if (filters?.partId) {
      list = list.filter((m) => m.partId === filters.partId);
    }
    if (filters?.type && filters.type !== "all") {
      list = list.filter((m) => m.type === filters.type);
    }
    return list;
  }

  async recordMovement(input: {
    partId: string;
    type: StockMovementType;
    quantity: number;
    referenceNumber: string;
    performedBy: string;
    notes?: string;
  }): Promise<StockMovement> {
    const part = this.parts.find((p) => p.id === input.partId);
    if (!part) throw new Error(`Part ${input.partId} not found`);

    // Determine signed delta: 'issued' subtracts, 'received' adds
    const isDeduction = input.type === "issued" || (input.type === "adjustment" && input.quantity < 0);
    const delta = isDeduction ? -Math.abs(input.quantity) : Math.abs(input.quantity);
    const newBalance = Math.max(0, part.quantityInStock + delta);

    const movement: StockMovement = {
      id: `mov_${Date.now()}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.model || part.partNumber,
      modality: part.modality,
      type: input.type,
      quantity: delta,
      balanceAfter: newBalance,
      referenceNumber: input.referenceNumber || "UNREFERENCED",
      performedBy: input.performedBy,
      date: new Date().toISOString(),
      notes: input.notes,
    };

    // Update part stock balance and lifecycle status
    part.quantityInStock = newBalance;
    if (newBalance <= part.minStockLevel) {
      part.status = "low_stock";
    } else if (part.status === "low_stock" && newBalance > part.minStockLevel) {
      part.status = "active";
    }
    part.updatedAt = new Date().toISOString();

    this.stockMovements.unshift(movement);
    this.saveToStorage();
    return movement;
  }

  // ── Suppliers ───────────────────────────────────────────────────────────────

  async getSuppliers(): Promise<Supplier[]> {
    return this.suppliers;
  }

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    return this.suppliers.find((s) => s.id === id);
  }

  // ── Dashboard Metrics & Charts ──────────────────────────────────────────────

  async getDashboardMetrics(): Promise<PartsDashboardMetrics> {
    const activeParts = this.parts.filter((p) => p.status !== "archived");

    const totalInventoryValue = activeParts.reduce(
      (sum, p) => sum + p.quantityInStock * p.unitPrice,
      0
    );

    const totalInventoryQuantity = activeParts.reduce(
      (sum, p) => sum + p.quantityInStock,
      0
    );

    const lowStockCount = activeParts.filter((p) => p.quantityInStock <= p.minStockLevel).length;

    // Modality breakdown
    const modalityMap: Record<string, number> = {};
    activeParts.forEach((p) => {
      const val = p.quantityInStock * p.unitPrice;
      modalityMap[p.modality] = (modalityMap[p.modality] || 0) + val;
    });

    const modalityDistribution = Object.entries(modalityMap).map(([modality, value]) => ({
      modality,
      value,
      percentage: totalInventoryValue > 0 ? Math.round((value / totalInventoryValue) * 100) : 0,
    }));

    // Expiry date buckets
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    let lessThan1Month = 0;
    let within6Months = 0;
    let greaterThan6Months = 0;
    let doesNotExpire = 0;

    activeParts.forEach((p) => {
      if (p.doesNotExpire || !p.expiryDate) {
        doesNotExpire += p.quantityInStock;
      } else {
        const exp = new Date(p.expiryDate);
        if (exp <= oneMonthFromNow) {
          lessThan1Month += p.quantityInStock;
        } else if (exp <= sixMonthsFromNow) {
          within6Months += p.quantityInStock;
        } else {
          greaterThan6Months += p.quantityInStock;
        }
      }
    });

    const expiryBuckets = [
      { bucket: "< 1 month" as const, count: lessThan1Month, color: "#EF4444" },
      { bucket: "6 months" as const, count: within6Months, color: "#F59E0B" },
      { bucket: "> 6 months" as const, count: greaterThan6Months, color: "#3B82F6" },
      { bucket: "Does not expire" as const, count: doesNotExpire, color: "#10B981" },
    ];

    const latestShrinkage = HISTORICAL_TRENDS[HISTORICAL_TRENDS.length - 1];

    return {
      totalInventoryValue,
      totalInventoryQuantity,
      shrinkageValue: latestShrinkage.shrinkageValue,
      shrinkageQuantity: latestShrinkage.shrinkageQuantity,
      lowStockCount,
      modalityDistribution,
      expiryBuckets,
      historicalTrends: HISTORICAL_TRENDS,
      recentMovements: this.stockMovements.slice(0, 6),
    };
  }

  // ── Stock Audit ─────────────────────────────────────────────────────────────

  async getAuditSheet(): Promise<AuditItem[]> {
    const activeParts = this.parts.filter((p) => p.status !== "archived");

    return activeParts.map((p) => {
      const purchaseYear = new Date(p.dateOfPurchase).getFullYear();
      const currentYear = new Date().getFullYear();
      const ageYears = Math.max(0, currentYear - purchaseYear);
      const ageStr = ageYears === 0 ? "< 1 yr" : `${ageYears} yr${ageYears > 1 ? "s" : ""}`;

      return {
        id: `aud_${p.id}`,
        partId: p.id,
        partNumber: p.partNumber,
        oemVendorPartNumber: p.oemVendorPartNumber,
        supplierName: p.supplierName,
        category: p.category,
        age: ageStr,
        oem: p.oem,
        modality: p.modality,
        model: p.model,
        quantityInStock: p.quantityInStock,
        quantityOnOrder: p.quantityOnOrder,
        unitPrice: p.unitPrice,
        location: p.location,
        column: p.column,
        row: p.row,
        auditedQuantity: null,
        shrinkageQuantity: null,
        shrinkageValue: null,
      };
    });
  }

  async saveAuditRun(
    date: string,
    items: AuditItem[],
    auditor: { id: string; name: string },
    notes?: string
  ): Promise<AuditRun> {
    const totalAudited = items.filter((i) => i.auditedQuantity !== null).length;
    const totalShrinkageQty = items.reduce(
      (sum, i) => sum + (i.shrinkageQuantity ?? 0),
      0
    );
    const totalShrinkageVal = items.reduce(
      (sum, i) => sum + (i.shrinkageValue ?? 0),
      0
    );

    // Saved with status "pending_approval" — DOES NOT OVERWRITE INVENTORY AUTOMATICALLY!
    const auditRun: AuditRun = {
      id: `run_${Date.now()}`,
      date,
      auditorId: auditor.id,
      auditorName: auditor.name,
      items,
      totalAudited,
      totalShrinkageQuantity: totalShrinkageQty,
      totalShrinkageValue: totalShrinkageVal,
      status: "pending_approval",
      notes,
    };

    this.auditHistory.unshift(auditRun);
    this.saveToStorage();
    return auditRun;
  }

  async approveAuditRun(runId: string, approvedBy: string): Promise<AuditRun> {
    const run = this.auditHistory.find((r) => r.id === runId);
    if (!run) throw new Error(`Audit run ${runId} not found`);

    run.status = "approved";
    run.approvedBy = approvedBy;
    run.approvalDate = new Date().toISOString();

    // Reconcile stock and generate audit_variance ledger movements for every variance
    run.items.forEach((item) => {
      if (item.auditedQuantity !== null) {
        const part = this.parts.find((p) => p.id === item.partId);
        if (part) {
          const variance = item.auditedQuantity - part.quantityInStock;
          if (variance !== 0) {
            const movement: StockMovement = {
              id: `mov_${Date.now()}_${item.partId}`,
              partId: item.partId,
              partNumber: item.partNumber,
              partName: item.model || item.partNumber,
              modality: item.modality,
              type: "audit_variance",
              quantity: variance,
              balanceAfter: item.auditedQuantity,
              referenceNumber: `AUD-${run.id.slice(-6).toUpperCase()}`,
              performedBy: approvedBy,
              date: new Date().toISOString(),
              notes: `Physical audit reconciliation (Book: ${part.quantityInStock}, Physical: ${item.auditedQuantity})`,
            };
            this.stockMovements.unshift(movement);
          }

          part.quantityInStock = item.auditedQuantity;
          part.status = part.quantityInStock <= part.minStockLevel ? "low_stock" : "active";
          part.updatedAt = new Date().toISOString();
        }
      }
    });

    this.saveToStorage();
    return run;
  }

  async rejectAuditRun(runId: string, rejectedBy: string): Promise<AuditRun> {
    const run = this.auditHistory.find((r) => r.id === runId);
    if (!run) throw new Error(`Audit run ${runId} not found`);

    run.status = "rejected";
    run.approvedBy = rejectedBy;
    run.approvalDate = new Date().toISOString();

    this.saveToStorage();
    return run;
  }

  async getAuditRuns(): Promise<AuditRun[]> {
    return this.auditHistory;
  }
}

export const partsService = new PartsService();
