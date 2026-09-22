import type { Personnel } from "@/modules/settings/types";
import { scheduleService } from "./schedule-service";
import { debriefService } from "./debrief-service";

export interface EngineerKPIRecord {
  engineerId: string;
  engineerName: string;
  jobTitle: string;
  department: string;
  ftfr: number; // First-Time Fix Rate (%)
  mttr: number; // Mean Time to Repair (hours)
  utilizationRate: number; // Technician Utilization Rate (%)
  avgTravelTimeHours: number; // Average Travel Time (hours)
  avgTravelDistanceKm: number; // Average Travel Distance (km)
  jobsCompletedCount: number; // Jobs Completed per Technician (volume count)
}

export interface TeamKPISummary {
  avgFTFR: number;
  avgMTTR: number;
  avgUtilization: number;
  avgTravelTimeHours: number;
  avgTravelDistanceKm: number;
  totalJobsCompleted: number;
}

// Deterministic baseline stats for biomedical roster to ensure consistent, realistic system KPIs
const BASELINE_ENGINEER_KPIS: Record<
  string,
  {
    ftfr: number;
    mttr: number;
    utilizationRate: number;
    avgTravelTimeHours: number;
    avgTravelDistanceKm: number;
    jobsCompletedCount: number;
  }
> = {
  per_001: { ftfr: 92, mttr: 2.8, utilizationRate: 80, avgTravelTimeHours: 1.2, avgTravelDistanceKm: 34, jobsCompletedCount: 6 },
  per_002: { ftfr: 88, mttr: 3.4, utilizationRate: 100, avgTravelTimeHours: 0.8, avgTravelDistanceKm: 22, jobsCompletedCount: 5 },
  per_003: { ftfr: 95, mttr: 2.1, utilizationRate: 80, avgTravelTimeHours: 1.8, avgTravelDistanceKm: 48, jobsCompletedCount: 7 },
  per_004: { ftfr: 78, mttr: 4.6, utilizationRate: 60, avgTravelTimeHours: 0.6, avgTravelDistanceKm: 15, jobsCompletedCount: 4 },
  per_005: { ftfr: 84, mttr: 3.1, utilizationRate: 80, avgTravelTimeHours: 1.4, avgTravelDistanceKm: 38, jobsCompletedCount: 5 },
  per_006: { ftfr: 91, mttr: 2.5, utilizationRate: 80, avgTravelTimeHours: 1.0, avgTravelDistanceKm: 28, jobsCompletedCount: 6 },
  per_007: { ftfr: 86, mttr: 3.6, utilizationRate: 100, avgTravelTimeHours: 2.2, avgTravelDistanceKm: 56, jobsCompletedCount: 4 },
  per_008: { ftfr: 89, mttr: 2.9, utilizationRate: 80, avgTravelTimeHours: 1.1, avgTravelDistanceKm: 31, jobsCompletedCount: 6 },
  per_009: { ftfr: 94, mttr: 2.2, utilizationRate: 80, avgTravelTimeHours: 0.9, avgTravelDistanceKm: 25, jobsCompletedCount: 7 },
  per_010: { ftfr: 82, mttr: 4.0, utilizationRate: 60, avgTravelTimeHours: 1.5, avgTravelDistanceKm: 42, jobsCompletedCount: 3 },
  per_011: { ftfr: 87, mttr: 3.2, utilizationRate: 80, avgTravelTimeHours: 1.3, avgTravelDistanceKm: 36, jobsCompletedCount: 5 },
  per_012: { ftfr: 90, mttr: 2.7, utilizationRate: 80, avgTravelTimeHours: 1.6, avgTravelDistanceKm: 44, jobsCompletedCount: 6 },
  per_013: { ftfr: 93, mttr: 2.4, utilizationRate: 80, avgTravelTimeHours: 1.7, avgTravelDistanceKm: 46, jobsCompletedCount: 6 },
};

class KPIService {
  async getEngineerKPIs(): Promise<{ records: EngineerKPIRecord[]; summary: TeamKPISummary }> {
    const engineers = await scheduleService.getBiomedicalEngineers();
    const jobs = await debriefService.list();

    const records: EngineerKPIRecord[] = engineers.map((eng, idx) => {
      const engFullName = `${eng.firstName} ${eng.lastName}`;
      const base = BASELINE_ENGINEER_KPIS[eng.id] || {
        ftfr: 85 + (idx % 8) * 2,
        mttr: 2.5 + (idx % 5) * 0.4,
        utilizationRate: 80,
        avgTravelTimeHours: 1.0 + (idx % 4) * 0.3,
        avgTravelDistanceKm: 25 + (idx % 6) * 6,
        jobsCompletedCount: 5 + (idx % 3),
      };

      // Realtime completed job count increment
      const completedForEng = jobs.filter(
        (j) =>
          (j.jobStatus === "Completed" || j.stage === "completed") &&
          (j.assignedToId === eng.id || j.assignedToName?.includes(eng.firstName))
      ).length;

      const totalCompleted = Math.max(base.jobsCompletedCount, completedForEng);

      return {
        engineerId: eng.id,
        engineerName: engFullName,
        jobTitle: eng.jobTitle || "Biomedical Engineer",
        department: eng.department || "Biomedical Engineering",
        ftfr: base.ftfr,
        mttr: base.mttr,
        utilizationRate: base.utilizationRate,
        avgTravelTimeHours: base.avgTravelTimeHours,
        avgTravelDistanceKm: base.avgTravelDistanceKm,
        jobsCompletedCount: totalCompleted,
      };
    });

    // Compute team averages
    const totalEng = records.length || 1;
    const avgFTFR = Math.round(records.reduce((acc, r) => acc + r.ftfr, 0) / totalEng);
    const avgMTTR = Number(
      (records.reduce((acc, r) => acc + r.mttr, 0) / totalEng).toFixed(1)
    );
    const avgUtilization = Math.round(
      records.reduce((acc, r) => acc + r.utilizationRate, 0) / totalEng
    );
    const avgTravelTimeHours = Number(
      (records.reduce((acc, r) => acc + r.avgTravelTimeHours, 0) / totalEng).toFixed(1)
    );
    const avgTravelDistanceKm = Math.round(
      records.reduce((acc, r) => acc + r.avgTravelDistanceKm, 0) / totalEng
    );
    const totalJobsCompleted = records.reduce((acc, r) => acc + r.jobsCompletedCount, 0);

    return {
      records,
      summary: {
        avgFTFR,
        avgMTTR,
        avgUtilization,
        avgTravelTimeHours,
        avgTravelDistanceKm,
        totalJobsCompleted,
      },
    };
  }
}

export const kpiService = new KPIService();
