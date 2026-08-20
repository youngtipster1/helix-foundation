import { MOCK_TOOLS } from "../mocks/tools-data";
import type { Tool, ToolInput, CalibrationStatus } from "../types";
import { respond, today } from "@/services/api/client";
import { toolsJobService } from "./tools-job-service";

let toolsStore: Tool[] = [...MOCK_TOOLS];
let nextIdCounter = 13;

export function computeCalibrationStatus(nextCalibrationDate: string): CalibrationStatus {
  if (!nextCalibrationDate) return "expired";
  
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const calDate = new Date(nextCalibrationDate);
  calDate.setHours(0, 0, 0, 0);

  const diffTime = calDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "expired";
  } else if (diffDays <= 30) {
    return "due_soon";
  } else {
    return "valid";
  }
}

export const toolsService = {
  async list(includeArchived = false): Promise<Tool[]> {
    const list = toolsStore
      .filter((tool) => (includeArchived ? true : !tool.isArchived))
      .map((tool) => ({
        ...tool,
        calibrationStatus: computeCalibrationStatus(tool.nextCalibrationDate),
      }));
    return respond(list);
  },

  async listArchived(): Promise<Tool[]> {
    const list = toolsStore
      .filter((tool) => tool.isArchived)
      .map((tool) => ({
        ...tool,
        calibrationStatus: computeCalibrationStatus(tool.nextCalibrationDate),
      }));
    return respond(list);
  },

  async getById(id: string): Promise<Tool | null> {
    const found = toolsStore.find((t) => t.id === id);
    if (!found) return respond(null);
    return respond({
      ...found,
      calibrationStatus: computeCalibrationStatus(found.nextCalibrationDate),
    });
  },

  async create(input: ToolInput): Promise<Tool> {
    const id = input.id || `TL-${nextIdCounter.toString().padStart(5, "0")}`;
    nextIdCounter++;

    const newTool: Tool = {
      ...input,
      id,
      calibrationStatus: input.calibrationStatus || computeCalibrationStatus(input.nextCalibrationDate),
      isArchived: false,
      createdAt: today(),
      updatedAt: today(),
    };

    toolsStore = [newTool, ...toolsStore];
    return respond(newTool);
  },

  async update(id: string, input: Partial<ToolInput>): Promise<Tool> {
    let updated: Tool | undefined;
    toolsStore = toolsStore.map((tool) => {
      if (tool.id !== id) return tool;
      const nextCal = input.nextCalibrationDate ?? tool.nextCalibrationDate;
      updated = {
        ...tool,
        ...input,
        calibrationStatus: input.calibrationStatus || computeCalibrationStatus(nextCal),
        updatedAt: today(),
      };
      return updated;
    });

    if (!updated) throw new Error(`Tool ${id} not found`);
    return respond(updated);
  },

  async archive(id: string, userName = "Admin"): Promise<{ success: boolean; message?: string }> {
    const tool = toolsStore.find((t) => t.id === id);
    if (!tool) throw new Error(`Tool ${id} not found`);

    // Check if tool has any open jobs
    const hasOpenJobs = await toolsJobService.hasOpenJobsForTool(id);
    if (hasOpenJobs) {
      return respond({
        success: false,
        message: "This tool cannot be archived while it has an open job.",
      });
    }

    toolsStore = toolsStore.map((t) =>
      t.id === id
        ? {
            ...t,
            isArchived: true,
            archivedDate: today(),
            archivedBy: userName,
            updatedAt: today(),
          }
        : t,
    );

    return respond({ success: true });
  },

  async restore(id: string): Promise<Tool> {
    let restored: Tool | undefined;
    toolsStore = toolsStore.map((t) => {
      if (t.id !== id) return t;
      restored = {
        ...t,
        isArchived: false,
        archivedDate: undefined,
        archivedBy: undefined,
        updatedAt: today(),
      };
      return restored;
    });

    if (!restored) throw new Error(`Tool ${id} not found`);
    return respond(restored);
  },

  async hasOpenJobs(toolId: string): Promise<boolean> {
    return toolsJobService.hasOpenJobsForTool(toolId);
  },
};
