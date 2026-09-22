import { debriefService } from "./debrief-service";
import {
  MOCK_ENGINEER_AVAILABILITY,
  type EngineerAvailability,
} from "../mocks/workforce-availability";
import type { DebriefJob } from "../types";
import type { SchedulingConflict } from "../components/schedule/schedule-types";
import { personnelService } from "@/modules/settings/services/personnel-service";
import type { Personnel } from "@/modules/settings/types";

class ScheduleService {
  private availability: EngineerAvailability[] = [...MOCK_ENGINEER_AVAILABILITY];

  getAvailability(): EngineerAvailability[] {
    return [...this.availability];
  }

  getEngineerAvailabilityForDate(
    personnelId: string,
    date: string
  ): EngineerAvailability | undefined {
    return this.availability.find(
      (a) =>
        (a.personnelId === personnelId ||
          a.personnelName.toLowerCase() === personnelId.toLowerCase()) &&
        a.date === date
    );
  }

  /**
   * Checks whether assigning a job to an engineer on a given date creates a conflict.
   * Consumes workforce availability (leave, training, off) & overlapping jobs.
   */
  async checkConflict(
    job: DebriefJob,
    targetEngineerId: string,
    targetEngineerName: string,
    targetDate: string
  ): Promise<SchedulingConflict> {
    // 1. Check Workforce Availability (Training, Leave, Off Day)
    const availRecord = this.getEngineerAvailabilityForDate(
      targetEngineerId,
      targetDate
    ) || this.availability.find(
      (a) =>
        a.personnelName.toLowerCase() === targetEngineerName.toLowerCase() &&
        a.date === targetDate
    );

    if (availRecord && availRecord.status !== "available") {
      let conflictType: "leave" | "training" | "off" = "training";
      if (availRecord.status === "leave") conflictType = "leave";
      if (availRecord.status === "off") conflictType = "off";

      return {
        hasConflict: true,
        type: conflictType,
        title: `Workforce Unavailable: ${availRecord.title}`,
        description: `${targetEngineerName} is marked as "${availRecord.title}" on ${targetDate}. ${availRecord.notes || ""}`,
        conflictingItem: availRecord,
        engineerId: targetEngineerId,
        engineerName: targetEngineerName,
        targetDate,
        job,
      };
    }

    // 2. Check Overlapping Scheduled Jobs on that date
    const allJobs = await debriefService.list();
    const existingJob = allJobs.find((j) => {
      if (j.id === job.id) return false; // Ignore self
      if (j.jobStatus === "Completed") return false;

      const sameEngineer =
        j.assignedToId === targetEngineerId ||
        (j.assignedToName &&
          j.assignedToName.toLowerCase() === targetEngineerName.toLowerCase());

      const sameDate =
        j.jobStartDate === targetDate || j.startDate === targetDate;

      return sameEngineer && sameDate;
    });

    if (existingJob) {
      return {
        hasConflict: true,
        type: "double_booking",
        title: `Overlapping Job Scheduled (${existingJob.jobNumber})`,
        description: `${targetEngineerName} is already scheduled for ${existingJob.jobNumber} (${existingJob.model} · ${existingJob.jobType}) on ${targetDate}.`,
        conflictingItem: existingJob,
        engineerId: targetEngineerId,
        engineerName: targetEngineerName,
        targetDate,
        job,
      };
    }

    return {
      hasConflict: false,
      type: "none",
      title: "No Conflicts",
      description: "Engineer is available and slot is open.",
      engineerId: targetEngineerId,
      engineerName: targetEngineerName,
      targetDate,
      job,
    };
  }

  /**
   * Reschedules an existing job's start date and updates it in debriefService.
   */
  async rescheduleJob(
    jobId: string,
    newDate: string,
    newTime?: string
  ): Promise<DebriefJob | null> {
    const job = await debriefService.getById(jobId);
    if (!job) return null;

    const updates: Partial<DebriefJob> = {
      jobStartDate: newDate,
      startDate: newDate,
    };

    if (newTime && job.complaintTime) {
      updates.complaintTime = newTime;
    }

    return await debriefService.update(job.id, updates);
  }

  /**
   * Reassigns an existing job to another engineer and optionally moves date.
   */
  async reassignJob(
    jobId: string,
    newEngineerId: string,
    newEngineerName: string,
    newDate?: string
  ): Promise<DebriefJob | null> {
    const job = await debriefService.getById(jobId);
    if (!job) return null;

    const updates: Partial<DebriefJob> = {
      assignedToId: newEngineerId,
      assignedToName: newEngineerName,
    };

    if (newDate) {
      updates.jobStartDate = newDate;
      updates.startDate = newDate;
    }

    return await debriefService.update(job.id, updates);
  }

  /**
   * Retrieves list of available engineers for reassignment dropdowns.
   */
  async getBiomedicalEngineers(): Promise<Personnel[]> {
    try {
      const allPersonnel = await personnelService.getPersonnel();
      const filtered = allPersonnel.filter(
        (p) =>
          p.status === "active" &&
          (p.department.toLowerCase().includes("clinical") ||
            p.department.toLowerCase().includes("workshop") ||
            p.jobTitle.toLowerCase().includes("engineer") ||
            p.jobTitle.toLowerCase().includes("specialist") ||
            p.jobTitle.toLowerCase().includes("technician"))
      );
      return filtered.length > 0 ? filtered : allPersonnel.slice(0, 6);
    } catch {
      return [];
    }
  }
}

export const scheduleService = new ScheduleService();
