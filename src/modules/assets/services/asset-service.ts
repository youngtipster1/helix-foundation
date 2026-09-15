import {
  Asset,
  AssetJob,
  ServiceContract,
  ContractPayment,
  CustomerDirectoryEntry,
  SupplierDirectoryEntry,
  AssetDashboardMetrics,
  ContractDashboardMetrics,
  EquipmentStatus,
  ContractStatus,
} from "../types";
import {
  MOCK_ASSETS,
  MOCK_CONTRACTS,
  MOCK_ASSET_JOBS,
  MOCK_CUSTOMERS,
  MOCK_SUPPLIERS,
} from "../mocks/asset-data";

const ASSETS_STORAGE_KEY = "hemp.assets.devices.v2";
const CONTRACTS_STORAGE_KEY = "hemp.assets.contracts.v2";
const JOBS_STORAGE_KEY = "hemp.assets.jobs.v2";
const CUSTOMERS_STORAGE_KEY = "hemp.assets.customers.v2";
const SUPPLIERS_STORAGE_KEY = "hemp.assets.suppliers.v2";

export class AssetService {
  private assets: Asset[] = [];
  private contracts: ServiceContract[] = [];
  private jobs: AssetJob[] = [];
  private customers: CustomerDirectoryEntry[] = [];
  private suppliers: SupplierDirectoryEntry[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedAssets = localStorage.getItem(ASSETS_STORAGE_KEY);
      this.assets = storedAssets ? JSON.parse(storedAssets) : [...MOCK_ASSETS];

      const storedContracts = localStorage.getItem(CONTRACTS_STORAGE_KEY);
      this.contracts = storedContracts ? JSON.parse(storedContracts) : [...MOCK_CONTRACTS];

      const storedJobs = localStorage.getItem(JOBS_STORAGE_KEY);
      this.jobs = storedJobs ? JSON.parse(storedJobs) : [...MOCK_ASSET_JOBS];

      const storedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      this.customers = storedCustomers ? JSON.parse(storedCustomers) : [...MOCK_CUSTOMERS];

      const storedSuppliers = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
      this.suppliers = storedSuppliers ? JSON.parse(storedSuppliers) : [...MOCK_SUPPLIERS];
    } catch {
      this.assets = [...MOCK_ASSETS];
      this.contracts = [...MOCK_CONTRACTS];
      this.jobs = [...MOCK_ASSET_JOBS];
      this.customers = [...MOCK_CUSTOMERS];
      this.suppliers = [...MOCK_SUPPLIERS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(this.assets));
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(this.contracts));
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(this.jobs));
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(this.customers));
      localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(this.suppliers));
    } catch (e) {
      console.error("Failed to save assets state to localStorage", e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in asset service subscriber", err);
      }
    });
  }

  // ==========================================
  // CUSTOMER & SUPPLIER DIRECTORY (FOR AUTO-FILL)
  // ==========================================
  public getCustomers(): CustomerDirectoryEntry[] {
    return this.customers;
  }

  public getCustomerByName(name: string): CustomerDirectoryEntry | undefined {
    return this.customers.find(
      (c) => c.customer.trim().toLowerCase() === name.trim().toLowerCase()
    );
  }

  public getSuppliers(): SupplierDirectoryEntry[] {
    return this.suppliers;
  }

  public getSupplierByName(name: string): SupplierDirectoryEntry | undefined {
    return this.suppliers.find(
      (s) => s.supplier.trim().toLowerCase() === name.trim().toLowerCase()
    );
  }

  // ==========================================
  // ASSET OPERATIONS
  // ==========================================
  public getAssets(includeArchived = false): Asset[] {
    return includeArchived ? this.assets : this.assets.filter((a) => !a.isArchived);
  }

  public getAssetById(id: string): Asset | undefined {
    return this.assets.find((a) => a.id === id);
  }

  public createAsset(
    input: Omit<Asset, "id" | "createdAt" | "updatedAt" | "isArchived">
  ): Asset {
    const newAsset: Asset = {
      ...input,
      id: `ast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      networkDiagrams: input.networkDiagrams || [],
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If attached to a contract, also sync contract's linkedEquipmentIds
    if (newAsset.contractId) {
      const contract = this.contracts.find((c) => c.id === newAsset.contractId);
      if (contract && !contract.linkedEquipmentIds.includes(newAsset.id)) {
        contract.linkedEquipmentIds.push(newAsset.id);
        newAsset.contractStatus = contract.contractStatus;
        newAsset.contractNumber = contract.contractNumber;
        newAsset.contractType = contract.contractType;
        newAsset.contractValue = contract.contractValue;
        newAsset.contractStartDate = contract.contractStartDate;
        newAsset.contractEndDate = contract.contractEndDate;
        newAsset.contractPoNumber = contract.poNumber;
      }
    }

    this.assets.unshift(newAsset);
    this.saveToStorage();
    return newAsset;
  }

  public createBatchAssets(
    items: Array<Omit<Asset, "id" | "createdAt" | "updatedAt" | "isArchived">>
  ): Asset[] {
    const created: Asset[] = [];
    const now = new Date().toISOString();

    items.forEach((input, index) => {
      const newAsset: Asset = {
        ...input,
        id: `ast_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
        networkDiagrams: input.networkDiagrams || [],
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      if (newAsset.contractId) {
        const contract = this.contracts.find((c) => c.id === newAsset.contractId);
        if (contract && !contract.linkedEquipmentIds.includes(newAsset.id)) {
          contract.linkedEquipmentIds.push(newAsset.id);
        }
      }

      this.assets.unshift(newAsset);
      created.push(newAsset);
    });

    this.saveToStorage();
    return created;
  }

  public updateAsset(id: string, updates: Partial<Asset>): Asset {
    const index = this.assets.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Asset ${id} not found`);
    }

    const current = this.assets[index];
    const previousContractId = current.contractId;

    const updated: Asset = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If contract changed, handle unlinking and linking
    if (updates.contractId !== undefined && updates.contractId !== previousContractId) {
      if (previousContractId) {
        const oldContract = this.contracts.find((c) => c.id === previousContractId);
        if (oldContract) {
          oldContract.linkedEquipmentIds = oldContract.linkedEquipmentIds.filter((eqId) => eqId !== id);
        }
      }

      if (updates.contractId) {
        const newContract = this.contracts.find((c) => c.id === updates.contractId);
        if (newContract) {
          if (!newContract.linkedEquipmentIds.includes(id)) {
            newContract.linkedEquipmentIds.push(id);
          }
          updated.contractStatus = newContract.contractStatus;
          updated.contractNumber = newContract.contractNumber;
          updated.contractType = newContract.contractType;
          updated.contractValue = newContract.contractValue;
          updated.contractStartDate = newContract.contractStartDate;
          updated.contractEndDate = newContract.contractEndDate;
          updated.contractPoNumber = newContract.poNumber;
        }
      } else {
        updated.contractStatus = "Out of Contract";
        updated.contractNumber = undefined;
        updated.contractType = undefined;
        updated.contractValue = undefined;
        updated.contractStartDate = undefined;
        updated.contractEndDate = undefined;
        updated.contractPoNumber = undefined;
      }
    }

    this.assets[index] = updated;
    this.saveToStorage();
    return updated;
  }

  public archiveAsset(id: string): Asset {
    return this.updateAsset(id, { isArchived: true });
  }

  public unarchiveAsset(id: string): Asset {
    return this.updateAsset(id, { isArchived: false });
  }

  // ==========================================
  // SERVICE CONTRACT OPERATIONS
  // ==========================================
  public getContracts(includeArchived = false): ServiceContract[] {
    return includeArchived ? this.contracts : this.contracts.filter((c) => !c.isArchived);
  }

  public getContractById(id: string): ServiceContract | undefined {
    return this.contracts.find((c) => c.id === id);
  }

  public createContract(
    input: Omit<
      ServiceContract,
      "id" | "createdAt" | "updatedAt" | "isArchived" | "totalAmountPaid" | "totalAmountOutstanding"
    >
  ): ServiceContract {
    const totalAmountPaid = (input.payments || [])
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalAmountOutstanding = Math.max(0, input.contractValue - totalAmountPaid);

    const newContract: ServiceContract = {
      ...input,
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      payments: input.payments || [],
      linkedEquipmentIds: input.linkedEquipmentIds || [],
      totalAmountPaid,
      totalAmountOutstanding,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update attached equipment with this contract's reference data
    newContract.linkedEquipmentIds.forEach((eqId) => {
      const asset = this.assets.find((a) => a.id === eqId);
      if (asset) {
        asset.contractId = newContract.id;
        asset.contractStatus = newContract.contractStatus;
        asset.contractNumber = newContract.contractNumber;
        asset.contractType = newContract.contractType;
        asset.contractValue = newContract.contractValue;
        asset.contractStartDate = newContract.contractStartDate;
        asset.contractEndDate = newContract.contractEndDate;
        asset.contractPoNumber = newContract.poNumber;
      }
    });

    this.contracts.unshift(newContract);
    this.saveToStorage();
    return newContract;
  }

  public updateContract(id: string, updates: Partial<ServiceContract>): ServiceContract {
    const index = this.contracts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Contract ${id} not found`);
    }

    const current = this.contracts[index];
    const payments = updates.payments !== undefined ? updates.payments : current.payments;
    const contractValue = updates.contractValue !== undefined ? updates.contractValue : current.contractValue;

    const totalAmountPaid = payments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalAmountOutstanding = Math.max(0, contractValue - totalAmountPaid);

    const updated: ServiceContract = {
      ...current,
      ...updates,
      payments,
      totalAmountPaid,
      totalAmountOutstanding,
      updatedAt: new Date().toISOString(),
    };

    // Sync contract info to all linked assets
    const linkedIds = updated.linkedEquipmentIds;
    this.assets.forEach((asset) => {
      if (linkedIds.includes(asset.id)) {
        asset.contractId = updated.id;
        asset.contractStatus = updated.contractStatus;
        asset.contractNumber = updated.contractNumber;
        asset.contractType = updated.contractType;
        asset.contractValue = updated.contractValue;
        asset.contractStartDate = updated.contractStartDate;
        asset.contractEndDate = updated.contractEndDate;
        asset.contractPoNumber = updated.poNumber;
      } else if (asset.contractId === updated.id) {
        // Unlinked
        asset.contractId = undefined;
        asset.contractStatus = "Out of Contract";
        asset.contractNumber = undefined;
        asset.contractType = undefined;
        asset.contractValue = undefined;
        asset.contractStartDate = undefined;
        asset.contractEndDate = undefined;
        asset.contractPoNumber = undefined;
      }
    });

    this.contracts[index] = updated;
    this.saveToStorage();
    return updated;
  }

  public archiveContract(id: string): ServiceContract {
    return this.updateContract(id, { isArchived: true });
  }

  public unarchiveContract(id: string): ServiceContract {
    return this.updateContract(id, { isArchived: false });
  }

  public addContractPayment(contractId: string, payment: Omit<ContractPayment, "id">): ServiceContract {
    const contract = this.getContractById(contractId);
    if (!contract) throw new Error(`Contract ${contractId} not found`);

    const newPayment: ContractPayment = {
      ...payment,
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    const updatedPayments = [...contract.payments, newPayment];
    return this.updateContract(contractId, { payments: updatedPayments });
  }

  public linkEquipmentToContract(contractId: string, assetId: string): ServiceContract {
    const contract = this.getContractById(contractId);
    if (!contract) throw new Error(`Contract ${contractId} not found`);

    if (!contract.linkedEquipmentIds.includes(assetId)) {
      const updatedLinked = [...contract.linkedEquipmentIds, assetId];
      return this.updateContract(contractId, { linkedEquipmentIds: updatedLinked });
    }
    return contract;
  }

  public unlinkEquipmentFromContract(contractId: string, assetId: string): ServiceContract {
    const contract = this.getContractById(contractId);
    if (!contract) throw new Error(`Contract ${contractId} not found`);

    const updatedLinked = contract.linkedEquipmentIds.filter((id) => id !== assetId);
    return this.updateContract(contractId, { linkedEquipmentIds: updatedLinked });
  }

  // ==========================================
  // ASSET JOBS
  // ==========================================
  public getJobs(assetId?: string): AssetJob[] {
    if (assetId) {
      return this.jobs.filter((j) => j.assetId === assetId);
    }
    return this.jobs;
  }

  public getJobsForContract(contractId: string): AssetJob[] {
    const contract = this.getContractById(contractId);
    if (!contract) return [];
    return this.jobs.filter(
      (j) => j.contractId === contractId || contract.linkedEquipmentIds.includes(j.assetId)
    );
  }

  public createJob(input: Omit<AssetJob, "id" | "createdAt">): AssetJob {
    const newJob: AssetJob = {
      ...input,
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    this.jobs.unshift(newJob);
    this.saveToStorage();
    return newJob;
  }

  // ==========================================
  // METRICS COMPUTATION
  // ==========================================
  public getAssetDashboardMetrics(): AssetDashboardMetrics {
    const activeAssets = this.getAssets(false);

    // Baseline numbers from client PPT (Slide 4)
    // Locations: 6 Geopolitical zones
    const locationBaseline: Record<string, { count: number; color: string }> = {
      "South South": { count: 23, color: "#10b981" },
      "South East": { count: 31, color: "#64748b" },
      "South West": { count: 68, color: "#f59e0b" },
      "North East": { count: 11, color: "#0284c7" },
      "North Central": { count: 46, color: "#c2410c" },
      "North West": { count: 31, color: "#60a5fa" },
    };

    // Modalities: Radiology, IVD, ENDOSCOPY
    const modalityBaseline: Record<string, { count: number; color: string }> = {
      Radiology: { count: 24, color: "#3b82f6" },
      IVD: { count: 120, color: "#ea580c" },
      ENDOSCOPY: { count: 37, color: "#94a3b8" },
    };

    // OEMs: GE, PHILIPS, SIEMENS, CANON, TENACORE
    const oemBaseline: Record<string, { count: number; color: string }> = {
      GE: { count: 12, color: "#3b82f6" },
      PHILIPS: { count: 100, color: "#ea580c" },
      SIEMENS: { count: 35, color: "#94a3b8" },
      CANON: { count: 65, color: "#eab308" },
      TENACORE: { count: 42, color: "#2563eb" },
    };

    // Incorporate any user-added assets beyond initial mock set
    const initialAssetIds = new Set(["ast_001", "ast_002", "ast_003", "ast_004", "ast_005", "ast_006"]);
    const userAddedAssets = activeAssets.filter((a) => !initialAssetIds.has(a.id));

    userAddedAssets.forEach((a) => {
      // Zone
      const zone = a.region || "South West";
      if (locationBaseline[zone]) {
        locationBaseline[zone].count++;
      } else {
        locationBaseline["South West"].count++;
      }

      // Modality
      const mod = a.modality?.toUpperCase() || "RADIOLOGY";
      if (mod.includes("IVD")) modalityBaseline["IVD"].count++;
      else if (mod.includes("ENDO")) modalityBaseline["ENDOSCOPY"].count++;
      else modalityBaseline["Radiology"].count++;

      // OEM
      const oemUpper = a.oem?.toUpperCase() || "GE";
      if (oemUpper.includes("PHILIP")) oemBaseline["PHILIPS"].count++;
      else if (oemUpper.includes("SIEMEN")) oemBaseline["SIEMENS"].count++;
      else if (oemUpper.includes("CANON")) oemBaseline["CANON"].count++;
      else if (oemUpper.includes("TENA")) oemBaseline["TENACORE"].count++;
      else oemBaseline["GE"].count++;
    });

    const assetsByLocation = Object.entries(locationBaseline).map(([location, data]) => ({
      location,
      count: data.count,
      color: data.color,
    }));

    const assetsByModality = Object.entries(modalityBaseline).map(([modality, data]) => ({
      modality,
      count: data.count,
      color: data.color,
    }));

    const assetsByOem = Object.entries(oemBaseline).map(([oem, data]) => ({
      oem,
      count: data.count,
      color: data.color,
    }));

    const totalEquipment = assetsByLocation.reduce((sum, item) => sum + item.count, 0);
    const totalOems = Object.keys(oemBaseline).length;
    const baseValue = 95200000;
    const totalValue = baseValue + userAddedAssets.reduce((sum, a) => sum + (a.contractValue || 0), 0);

    const warrantyDistribution = [
      { name: "WARRANTY", value: Math.round(totalEquipment * 0.75), percentage: 75, color: "#10b981" },
      { name: "OUT OF WARRANTY", value: Math.round(totalEquipment * 0.25), percentage: 25, color: "#ef4444" },
    ];

    const equipmentStatusDistribution = [
      { name: "UP", value: Math.round(totalEquipment * 0.72), percentage: 72, color: "#0284c7" },
      { name: "UP PARTIALLY UP", value: Math.round(totalEquipment * 0.10), percentage: 10, color: "#f97316" },
      { name: "DOWN", value: Math.round(totalEquipment * 0.12), percentage: 12, color: "#ef4444" },
      { name: "UNKNOWN", value: Math.round(totalEquipment * 0.06), percentage: 6, color: "#111827" },
    ];

    return {
      totalEquipment,
      totalValue,
      totalOems,
      warrantyDistribution,
      equipmentStatusDistribution,
      assetsByLocation,
      assetsByModality,
      assetsByOem,
    };
  }

  public getContractDashboardMetrics(): ContractDashboardMetrics {
    const activeContracts = this.getContracts(false);

    const totalContracts = activeContracts.length;
    const baseValue = 95200000;
    const totalValue = baseValue + activeContracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);
    const totalAmountPaid = activeContracts.reduce((sum, c) => sum + (c.totalAmountPaid || 0), 0) || 78241666;
    const totalAmountOutstanding = activeContracts.reduce(
      (sum, c) => sum + (c.totalAmountOutstanding || 0),
      0
    ) || 16958334;
    const amountPayableNextMonth = activeContracts.reduce(
      (sum, c) => sum + (c.amountPayableNextMonth || 0),
      0
    ) || 16958334;

    const totalEquipment = 210;
    const equipmentUnderContract = Math.round(totalEquipment * 0.25); // 25% on contract
    const notUnderContract = totalEquipment - equipmentUnderContract; // 75% not on contract

    // Donut 1: Contract vs Not on Contract (matching slide 17: Red 75%, Green 25%)
    const equipmentContractPercentage = [
      { name: "CONTRACT", value: equipmentUnderContract, percentage: 25, color: "#10b981" },
      { name: "NOT ON CONTRACT", value: notUnderContract, percentage: 75, color: "#ef4444" },
    ];

    // Donut 2: Contract type distribution matching slide 17:
    // PM ONLY, LABOUR ONLY (22%), PM + LABOUR (24%), COMPREHENSIVE
    const contractTypeDistribution = [
      { name: "PM ONLY", value: 28, percentage: 27, color: "#0284c7" },
      { name: "LABOUR ONLY", value: 23, percentage: 22, color: "#f97316" },
      { name: "PM + LABOUR", value: 25, percentage: 24, color: "#94a3b8" },
      { name: "COMPREHENSIVE", value: 28, percentage: 27, color: "#10b981" },
    ];

    // Slide 17 Bar charts:
    const contractsByLocation = [
      { location: "South South", count: 23, color: "#10b981" },
      { location: "South East", count: 31, color: "#64748b" },
      { location: "South West", count: 68, color: "#f59e0b" },
      { location: "North East", count: 11, color: "#0284c7" },
      { location: "North Central", count: 46, color: "#c2410c" },
      { location: "North West", count: 31, color: "#60a5fa" },
    ];

    const contractsByModality = [
      { modality: "Radiology", count: 24, color: "#3b82f6" },
      { modality: "IVD", count: 120, color: "#ea580c" },
      { modality: "ENDOSCOPY", count: 37, color: "#94a3b8" },
    ];

    const contractsByOem = [
      { oem: "GE", count: 12, color: "#3b82f6" },
      { oem: "PHILIPS", count: 100, color: "#ea580c" },
      { oem: "SIEMENS", count: 35, color: "#94a3b8" },
      { oem: "CANON", count: 65, color: "#eab308" },
      { oem: "TENACORE", count: 42, color: "#2563eb" },
    ];

    return {
      totalValue,
      totalContracts,
      equipmentUnderContract,
      totalAmountPaid,
      totalAmountOutstanding,
      amountPayableNextMonth,
      equipmentContractPercentage,
      contractTypeDistribution,
      contractsByLocation,
      contractsByModality,
      contractsByOem,
    };
  }
}

export const assetService = new AssetService();
