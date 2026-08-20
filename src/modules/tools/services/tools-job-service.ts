import { MOCK_JOBS } from "../mocks/jobs-data";
import type {
  ToolJob,
  CreateJobInput,
  UpdateJobAdminInput,
  UpdateJobOperationalInput,
  JobType,
  ToolSnapshot,
} from "../types";
import { respond, today } from "@/services/api/client";

let jobsStore: ToolJob[] = [...MOCK_JOBS];
let nextJobSeq = 19; // Current highest in mock is T00018

export const toolsJobService = {
  async list(filter?: "all" | "open" | "closed"): Promise<ToolJob[]> {
    let list = jobsStore.filter((j) => !j.isArchived);
    if (filter === "open") {
      list = list.filter((j) => j.jobStatus !== "Completed");
    } else if (filter === "closed") {
      list = list.filter((j) => j.jobStatus === "Completed");
    }
    return respond(list);
  },

  async listArchived(): Promise<ToolJob[]> {
    const list = jobsStore.filter((j) => j.isArchived);
    return respond(list);
  },

  async listByToolId(toolId: string): Promise<ToolJob[]> {
    const list = jobsStore.filter((j) => j.toolId === toolId && !j.isArchived);
    return respond(list);
  },

  async getById(id: string): Promise<ToolJob | null> {
    const found = jobsStore.find((j) => j.id === id || j.jobNumber === id);
    return respond(found ?? null);
  },

  async hasOpenJobsForTool(toolId: string): Promise<boolean> {
    const openJobs = jobsStore.filter(
      (j) => j.toolId === toolId && !j.isArchived && j.jobStatus !== "Completed",
    );
    return openJobs.length > 0;
  },

  /**
   * Rule 23: Determine whether selected job type requires valid calibration
   */
  jobTypeRequiresCalibration(jobType: JobType): boolean {
    return jobType === "Calibration";
  },

  async create(input: CreateJobInput, toolSnapshot: ToolSnapshot): Promise<ToolJob> {
    const jobNumber = `T${nextJobSeq.toString().padStart(5, "0")}`;
    nextJobSeq++;

    const newJob: ToolJob = {
      id: jobNumber,
      jobNumber,
      toolId: input.toolId,
      toolSnapshot,
      jobType: input.jobType,
      openDate: today(),
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      assignedToId: input.assignedToId,
      assignedToName: input.assignedToName,
      issue: input.issue,
      toolStatus: input.toolStatus,
      jobStatus: "Not Started",
      isArchived: false,
      createdAt: today(),
      updatedAt: today(),
    };

    jobsStore = [newJob, ...jobsStore];
    return respond(newJob);
  },

  async updateAdminFields(id: string, input: UpdateJobAdminInput): Promise<ToolJob> {
    let updated: ToolJob | undefined;
    jobsStore = jobsStore.map((j) => {
      if (j.id !== id && j.jobNumber !== id) return j;
      updated = {
        ...j,
        ...input,
        updatedAt: today(),
      };
      return updated;
    });

    if (!updated) throw new Error(`Job ${id} not found`);
    return respond(updated);
  },

  async updateOperationalFields(id: string, input: UpdateJobOperationalInput): Promise<ToolJob> {
    let updated: ToolJob | undefined;
    jobsStore = jobsStore.map((j) => {
      if (j.id !== id && j.jobNumber !== id) return j;

      let effectiveStatus = input.jobStatus;
      // Rule 28: If Job Close Date is entered, Job Status = Completed automatically.
      if (input.closeDate && input.closeDate.trim() !== "") {
        effectiveStatus = "Completed";
      }

      updated = {
        ...j,
        ...input,
        jobStatus: effectiveStatus,
        updatedAt: today(),
      };
      return updated;
    });

    if (!updated) throw new Error(`Job ${id} not found`);
    return respond(updated);
  },

  async closeJob(id: string): Promise<ToolJob> {
    let updated: ToolJob | undefined;
    jobsStore = jobsStore.map((j) => {
      if (j.id !== id && j.jobNumber !== id) return j;
      updated = {
        ...j,
        jobStatus: "Completed",
        closeDate: today(),
        updatedAt: today(),
      };
      return updated;
    });

    if (!updated) throw new Error(`Job ${id} not found`);
    return respond(updated);
  },

  async archive(id: string, userName = "Admin"): Promise<ToolJob> {
    let archived: ToolJob | undefined;
    jobsStore = jobsStore.map((j) => {
      if (j.id !== id && j.jobNumber !== id) return j;
      archived = {
        ...j,
        isArchived: true,
        archivedDate: today(),
        archivedBy: userName,
        updatedAt: today(),
      };
      return archived;
    });

    if (!archived) throw new Error(`Job ${id} not found`);
    return respond(archived);
  },

  async restore(id: string): Promise<ToolJob> {
    let restored: ToolJob | undefined;
    jobsStore = jobsStore.map((j) => {
      if (j.id !== id && j.jobNumber !== id) return j;
      restored = {
        ...j,
        isArchived: false,
        archivedDate: undefined,
        archivedBy: undefined,
        updatedAt: today(),
      };
      return restored;
    });

    if (!restored) throw new Error(`Job ${id} not found`);
    return respond(restored);
  },
};
