import { MOCK_DEBRIEF_JOBS } from "../mocks/debrief-data";
import type { DebriefJob, CreateJobInput, DebriefLabourRecord, DebriefPartUsed, DebriefExpense, DebriefDocument, DebriefToolUsed } from "../types";
import type { User } from "@/features/auth/types";
import { isModuleAdmin } from "@/features/auth/permissions";

const STORAGE_KEY = "hemp.debrief.jobs";

class DebriefService {
  private jobs: DebriefJob[] = [];
  private initialized = false;

  private init() {
    if (this.initialized) return;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.jobs = JSON.parse(stored);
          this.initialized = true;
          return;
        }
      } catch (e) {
        console.error("Failed to load debrief jobs from storage", e);
      }
    }
    this.jobs = [...MOCK_DEBRIEF_JOBS];
    this.save();
    this.initialized = true;
  }

  private save() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.jobs));
      } catch (e) {
        console.error("Failed to save debrief jobs to storage", e);
      }
    }
  }

  /**
   * Returns jobs filtered by user permissions.
   * Admin can view all jobs; User can only see jobs assigned to him/her.
   */
  async list(user?: User | null): Promise<DebriefJob[]> {
    this.init();
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!user) return [...this.jobs];

    const isAdmin =
      user.isSuperAdmin ||
      user.role === "Super Admin" ||
      isModuleAdmin(user, "debrief") ||
      (user.role || "").toLowerCase().includes("admin");

    if (isAdmin) {
      return [...this.jobs];
    }

    const userId = user.id || "";
    const userFullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
    const userFirstName = (user.firstName || "").toLowerCase();

    return this.jobs.filter((job) => {
      const isAssigned =
        job.assignedToId === userId ||
        (job.assignedToName && job.assignedToName.toLowerCase().includes(userFullName)) ||
        (job.assignedToName && job.assignedToName.toLowerCase().includes(userFirstName));

      const isAssistant =
        (job.assistedByIds && job.assistedByIds.includes(userId)) ||
        (job.assistedByNames &&
          job.assistedByNames.some(
            (name) => name.toLowerCase().includes(userFullName) || name.toLowerCase().includes(userFirstName)
          )) ||
        (job.assistedBy && job.assistedBy.toLowerCase().includes(userFirstName));

      return isAssigned || isAssistant;
    });
  }

  /**
   * Returns active jobs for current engineer's "My Work" queue.
   * Only includes jobs that are In Progress or On Hold (not Completed).
   */
  async getMyWork(user?: User | null): Promise<DebriefJob[]> {
    const assignedJobs = await this.list(user);
    return assignedJobs.filter(
      (job) => job.jobStatus === "In Progress" || job.jobStatus === "On Hold" || job.jobStatus === "Open"
    );
  }

  async getById(id: string): Promise<DebriefJob | null> {
    this.init();
    const match = this.jobs.find((j) => j.id === id || j.jobNumber === id);
    return match ? { ...match } : null;
  }

  /**
   * Creates a new Job with system-generated Job Number (JOB-2026-XXXX).
   * Only accessible by Admin.
   */
  async create(input: CreateJobInput): Promise<DebriefJob> {
    this.init();

    // Generate unique sequential Job Number
    const count = this.jobs.length + 1;
    const padded = String(count).padStart(4, "0");
    const jobNumber = `JOB-2026-${padded}`;
    const id = `deb_job_${Date.now()}`;
    const now = new Date().toISOString();

    const assistedByString =
      input.assistedByNames && input.assistedByNames.length > 0
        ? input.assistedByNames.join(", ")
        : "—";

    const newJob: DebriefJob = {
      id,
      jobNumber,
      assetNumber: input.assetNumber,
      modality: input.modality,
      oem: input.oem,
      model: input.model,
      serialNumber: input.serialNumber,
      warrantyStartDate: input.warrantyStartDate,
      warrantyEndDate: input.warrantyEndDate,
      contractStartDate: "2026-01-01",
      contractEndDate: input.contractEndDate,
      contractType: input.contractType,
      yearOfManufacture: input.yearOfManufacture,
      jobType: input.jobType,
      jobOpenDate: input.jobOpenDate,
      jobStartDate: input.jobStartDate,
      equipmentStatus: input.equipmentStatus,
      jobPriority: input.jobPriority,
      assignedToId: input.assignedToId,
      assignedToName: input.assignedToName,
      assistedByIds: input.assistedByIds || [],
      assistedByNames: input.assistedByNames || [],
      assistedBy: assistedByString,
      complaintDate: input.complaintDate,
      complaintTime: input.complaintTime,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      location: input.location,
      address: input.address,
      reportedIssue: input.reportedIssue,
      startDate: input.jobStartDate,
      endDate: input.endDate || "—",
      rootCause: "—",
      resolution: "—",
      jobStatus: "In Progress",
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.unshift(newJob);
    this.save();
    return { ...newJob };
  }

  async update(id: string, updates: Partial<DebriefJob>): Promise<DebriefJob | null> {
    this.init();
    const index = this.jobs.findIndex((j) => j.id === id || j.jobNumber === id);
    if (index === -1) return null;

    this.jobs[index] = {
      ...this.jobs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return { ...this.jobs[index] };
  }

  async delete(id: string): Promise<boolean> {
    this.init();
    const lenBefore = this.jobs.length;
    this.jobs = this.jobs.filter((j) => j.id !== id);
    if (this.jobs.length !== lenBefore) {
      this.save();
      return true;
    }
    return false;
  }
}

export const debriefService = new DebriefService();
