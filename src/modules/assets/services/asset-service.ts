import {
  Asset,
  AssetJob,
  ServiceContract,
  ContractPayment,
  CustomerDirectoryEntry,
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
} from "../mocks/asset-data";

const ASSETS_STORAGE_KEY = "hemp.assets.devices.v1";
const CONTRACTS_STORAGE_KEY = "hemp.assets.contracts.v1";
const JOBS_STORAGE_KEY = "hemp.assets.jobs.v1";
const CUSTOMERS_STORAGE_KEY = "hemp.assets.customers.v1";

export class AssetService {
  private assets: Asset[] = [];
  private contracts: ServiceContract[] = [];
  private jobs: AssetJob[] = [];
  private customers: CustomerDirectoryEntry[] = [];
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
    } catch {
      this.assets = [...MOCK_ASSETS];
      this.contracts = [...MOCK_CONTRACTS];
      this.jobs = [...MOCK_ASSET_JOBS];
      this.customers = [...MOCK_CUSTOMERS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(this.assets));
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(this.contracts));
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(this.jobs));
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(this.customers));
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
  // CUSTOMER DIRECTORY (FOR AUTO-FILL)
  // ==========================================
  public getCustomers(): CustomerDirectoryEntry[] {
    return this.customers;
  }

  public getCustomerByName(name: string): CustomerDirectoryEntry | undefined {
    return this.customers.find(
      (c) => c.customer.trim().toLowerCase() === name.trim().toLowerCase()
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
    const totalEquipment = activeAssets.length;
    const totalValue = activeAssets.reduce((sum, a) => sum + (a.contractValue || 0), 0);

    const oemsSet = new Set(activeAssets.map((a) => a.oem).filter(Boolean));
    const totalOems = oemsSet.size;

    // Warranty distribution
    const warrantyCount: Record<string, number> = {
      Warranty: 0,
      "Out of Warranty": 0,
    };
    activeAssets.forEach((a) => {
      if (a.warrantyStatus === "Warranty") warrantyCount["Warranty"]++;
      else warrantyCount["Out of Warranty"]++;
    });

    const warrantyDistribution = [
      { name: "Warranty", value: warrantyCount["Warranty"], color: "#10b981" },
      { name: "Out of Warranty", value: warrantyCount["Out of Warranty"], color: "#ef4444" },
    ];

    // Status distribution
    const statusCounts: Record<EquipmentStatus, number> = {
      Up: 0,
      "Partially Up": 0,
      Down: 0,
      Unknown: 0,
    };
    activeAssets.forEach((a) => {
      if (statusCounts[a.equipmentStatus] !== undefined) {
        statusCounts[a.equipmentStatus]++;
      } else {
        statusCounts["Unknown"]++;
      }
    });

    const equipmentStatusDistribution = [
      { name: "Up", value: statusCounts["Up"], color: "#10b981" },
      { name: "Partially Up", value: statusCounts["Partially Up"], color: "#f59e0b" },
      { name: "Down", value: statusCounts["Down"], color: "#ef4444" },
      { name: "Unknown", value: statusCounts["Unknown"], color: "#9ca3af" },
    ];

    // Location distribution
    const locMap: Record<string, number> = {};
    activeAssets.forEach((a) => {
      const loc = a.location || "Unassigned";
      locMap[loc] = (locMap[loc] || 0) + 1;
    });
    const assetsByLocation = Object.entries(locMap).map(([location, count]) => ({
      location,
      count,
    }));

    // Modality distribution
    const modMap: Record<string, number> = {};
    activeAssets.forEach((a) => {
      const mod = a.modality || "General";
      modMap[mod] = (modMap[mod] || 0) + 1;
    });
    const assetsByModality = Object.entries(modMap).map(([modality, count]) => ({
      modality,
      count,
    }));

    // OEM distribution
    const oemMap: Record<string, number> = {};
    activeAssets.forEach((a) => {
      const oem = a.oem || "Other";
      oemMap[oem] = (oemMap[oem] || 0) + 1;
    });
    const assetsByOem = Object.entries(oemMap).map(([oem, count]) => ({
      oem,
      count,
    }));

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
    const activeAssets = this.getAssets(false);

    const totalContracts = activeContracts.length;
    const totalValue = activeContracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);
    const totalAmountPaid = activeContracts.reduce((sum, c) => sum + (c.totalAmountPaid || 0), 0);
    const totalAmountOutstanding = activeContracts.reduce(
      (sum, c) => sum + (c.totalAmountOutstanding || 0),
      0
    );
    const amountPayableNextMonth = activeContracts.reduce(
      (sum, c) => sum + (c.amountPayableNextMonth || 0),
      0
    );

    // Count equipment under contract
    const contractedEquipIds = new Set<string>();
    activeContracts.forEach((c) => {
      c.linkedEquipmentIds.forEach((id) => contractedEquipIds.add(id));
    });
    const equipmentUnderContract = contractedEquipIds.size;
    const notUnderContract = Math.max(0, activeAssets.length - equipmentUnderContract);

    const equipmentContractPercentage = [
      { name: "In Contract", value: equipmentUnderContract, color: "#10b981" },
      { name: "Out of Contract", value: notUnderContract, color: "#ef4444" },
    ];

    // Contract type distribution
    const typeMap: Record<string, number> = {};
    activeContracts.forEach((c) => {
      const type = c.contractType || "NO CONTRACT";
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    const contractTypeDistribution = Object.entries(typeMap).map(([name, value], idx) => {
      const palette = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#64748b"];
      return {
        name,
        value,
        color: palette[idx % palette.length],
      };
    });

    // Locations, Modality, OEM of equipment under contracts
    const locMap: Record<string, number> = {};
    const modMap: Record<string, number> = {};
    const oemMap: Record<string, number> = {};

    activeContracts.forEach((c) => {
      const linked = activeAssets.filter((a) => c.linkedEquipmentIds.includes(a.id));
      linked.forEach((a) => {
        const loc = a.location || "Unassigned";
        locMap[loc] = (locMap[loc] || 0) + 1;
        const mod = a.modality || "General";
        modMap[mod] = (modMap[mod] || 0) + 1;
        const oem = a.oem || "Other";
        oemMap[oem] = (oemMap[oem] || 0) + 1;
      });
    });

    return {
      totalValue,
      totalContracts,
      equipmentUnderContract,
      totalAmountPaid,
      totalAmountOutstanding,
      amountPayableNextMonth,
      equipmentContractPercentage,
      contractTypeDistribution,
      contractsByLocation: Object.entries(locMap).map(([location, count]) => ({ location, count })),
      contractsByModality: Object.entries(modMap).map(([modality, count]) => ({ modality, count })),
      contractsByOem: Object.entries(oemMap).map(([oem, count]) => ({ oem, count })),
    };
  }
}

export const assetService = new AssetService();
